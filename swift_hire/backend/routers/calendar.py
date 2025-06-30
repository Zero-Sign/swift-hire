import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

import models
from database import get_db
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Load environment variables from .env file
load_dotenv()

router = APIRouter(
    prefix="/calendar",
    tags=["calendar"],
)

# Email configuration
EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587


class CalendarInviteRequest(BaseModel):
    candidate_email: str
    summary: str
    description: str
    start_time: str
    end_time: str
    timezone: str
    meet_link: str


@router.post("/send-calendar-invite", status_code=status.HTTP_200_OK)
def send_calendar_invite(
    invite_request: CalendarInviteRequest, db: Session = Depends(get_db)
):
    """
    Send an email with calendar invite to candidate for interview
    """
    try:
        # Get candidate information
        candidate = (
            db.query(models.Candidate)
            .filter(models.Candidate.email == invite_request.candidate_email)
            .first()
        )

        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
            )

        # Format dates for iCalendar
        start_date = datetime.fromisoformat(
            invite_request.start_time.replace("Z", "+00:00")
        )
        end_date = datetime.fromisoformat(
            invite_request.end_time.replace("Z", "+00:00")
        )

        # Create email message
        msg = MIMEMultipart("alternative")
        msg["From"] = EMAIL_SENDER
        msg["To"] = invite_request.candidate_email
        msg["Subject"] = invite_request.summary

        # Create iCalendar event
        ical_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//hacksw/handcal//NONSGML v1.0//EN
BEGIN:VEVENT
UID:{datetime.now().strftime("%Y%m%dT%H%M%SZ")}@interview.com
DTSTAMP:{datetime.now().strftime("%Y%m%dT%H%M%SZ")}
DTSTART:{start_date.strftime("%Y%m%dT%H%M%SZ")}
DTEND:{end_date.strftime("%Y%m%dT%H%M%SZ")}
SUMMARY:{invite_request.summary}
DESCRIPTION:{invite_request.description}\n\nMeeting Link: {invite_request.meet_link}
LOCATION:Online - Google Meet
URL:{invite_request.meet_link}
END:VEVENT
END:VCALENDAR
"""

        # Plain text version (fallback)
        plain_text = f"""
Dear {candidate.name},

You have been invited to an interview session.

Event: {invite_request.summary}
Description: {invite_request.description}
Date & Time: {start_date.strftime("%A, %B %d, %Y at %I:%M %p")} - {end_date.strftime("%I:%M %p")} {invite_request.timezone}
Meeting Link: {invite_request.meet_link}

Please join the meeting using the link above at the scheduled time.

Thank you,
Recruitment Team
"""

        # HTML version
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, Helvetica, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }}
        .header {{ background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: white; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }}
        .meeting-details {{ margin: 20px 0; padding: 15px; background-color: #f1f1f1; border-radius: 5px; }}
        .meeting-link {{ padding: 10px; background-color: #e9f5ff; border-radius: 5px; margin: 15px 0; }}
        .button {{ display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Interview Invitation</h1>
        </div>
        <div class="content">
            <h2>Dear {candidate.name},</h2>
            <p>You have been invited to an interview session.</p>
            
            <div class="meeting-details">
                <p><strong>Event:</strong> {invite_request.summary}</p>
                <p><strong>Description:</strong> {invite_request.description}</p>
                <p><strong>Date & Time:</strong> {start_date.strftime("%A, %B %d, %Y at %I:%M %p")} - {end_date.strftime("%I:%M %p")} {invite_request.timezone}</p>
            </div>
            
            <div class="meeting-link">
                <p><strong>Meeting Link:</strong></p>
                <p><a href="{invite_request.meet_link}" target="_blank">{invite_request.meet_link}</a></p>
                <p>Please click the link above at the scheduled time to join the meeting.</p>
            </div>
            
            <p>Please ensure you are in a quiet environment with stable internet connectivity. Have your resume and any relevant materials ready for discussion.</p>
            
            <p>Thank you,<br>Recruitment Team</p>
        </div>
    </div>
</body>
</html>
"""

        # Attach plain text and HTML versions
        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        # Add the calendar invite as an attachment
        cal_attachment = MIMEText(ical_content, "calendar")
        cal_attachment.add_header(
            "Content-Disposition", "attachment", filename="invite.ics"
        )
        cal_attachment.add_header("Content-Type", "text/calendar", method="REQUEST")
        msg.attach(cal_attachment)

        try:
            # Connect to Gmail's SMTP server
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()  # Enable TLS
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            # Send email
            server.sendmail(
                EMAIL_SENDER, invite_request.candidate_email, msg.as_string()
            )
            server.quit()
            print(
                f"Calendar invite sent successfully to {invite_request.candidate_email}"
            )
            return {"message": "Calendar invite sent successfully"}
        except smtplib.SMTPAuthenticationError as e:
            print(f"SMTP Authentication Error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to authenticate with SMTP server. Check email credentials.",
            )
        except Exception as e:
            print(
                f"Failed to send calendar invite to {invite_request.candidate_email}: {str(e)}"
            )
            raise HTTPException(
                status_code=500, detail=f"Failed to send calendar invite: {str(e)}"
            )

    except Exception as e:
        print(f"Error processing calendar invite: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to process calendar invite: {str(e)}"
        )
