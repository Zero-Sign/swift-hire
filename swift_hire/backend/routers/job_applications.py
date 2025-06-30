import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

import models
import schemas
from database import get_db
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

load_dotenv()

router = APIRouter(
    prefix="/job-applications",
    tags=["job-applications"],
)

EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587


def send_email(
    to_email: str, candidate_name: str, job_title: str, company: str, status: str
):
    msg = MIMEMultipart("alternative")
    msg["From"] = EMAIL_SENDER
    msg["To"] = to_email
    msg["Subject"] = f"Job Application Status Update - {job_title} at {company}"

    plain_text = f"""
Dear {candidate_name},

We are writing to update you on your application for the {job_title} position at {company}.

Status: {status}

{"Congratulations! Your application has been shortlisted. Our team will contact you soon with next steps." if status == "Shortlisted" else "Thank you for applying. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time."}

Thank you for your interest in {company}. For any questions, please contact us at {EMAIL_SENDER}.

Best regards,
Abdullah Zubair
Recruitment Team
"""

    if status == "Shortlisted":
        status_message = f"""
        <p>Congratulations! Your application has been <strong>shortlisted</strong>. 
        Our recruitment team will reach out to you soon with the next steps in the 
        interview process. We appreciate your interest in joining {company} and look 
        forward to speaking with you.</p>
        """
    else:
        status_message = f"""
        <p>Thank you for applying. After careful consideration, we regret to inform you 
        that we will not be moving forward with your application at this time. We greatly 
        appreciate your interest in {company} and wish you the best in your future endeavors.</p>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, Helvetica, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }}
            .header {{ background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
            .header h1 {{ margin: 0; font-size: 24px; }}
            .content {{ background-color: white; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }}
            .content h2 {{ color: #007bff; font-size: 20px; margin-top: 0; }}
            .details {{ margin: 20px 0; padding: 15px; background-color: #f1f1f1; border-radius: 5px; }}
            .details p {{ margin: 5px 0; }}
            .status {{ font-weight: bold; color: {"#28a745" if status == "Shortlisted" else "#dc3545"}; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #777; }}
            .footer a {{ color: #007bff; text-decoration: none; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Job Application Update</h1>
            </div>
            <div class="content">
                <h2>Dear {candidate_name},</h2>
                <p>We are pleased to provide an update on your application for the <strong>{job_title}</strong> position at <strong>{company}</strong>.</p>
                <div class="details">
                    <p><strong>Application Status:</strong> <span class="status">{status}</span></p>
                    <p><strong>Job Title:</strong> {job_title}</p>
                    <p><strong>Company:</strong> {company}</p>
                </div>
                {status_message}
                <p>If you have any questions or need further assistance, please feel free to contact us at <a href="mailto:{EMAIL_SENDER}">{EMAIL_SENDER}</a>.</p>
                <p>Best regards,<br>Abdullah Zubair<br>Recruitment Team</p>
            </div>
            <div class="footer">
                <p>This is an automated message. Please do not reply directly to this email. For inquiries, contact <a href="mailto:{EMAIL_SENDER}">{EMAIL_SENDER}</a>.</p>
                <p>© {company} Recruitment. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_SENDER, to_email, msg.as_string())
        server.quit()
        print(f"Email sent successfully to {to_email}")
    except smtplib.SMTPAuthenticationError as e:
        print(f"SMTP Authentication Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to authenticate with SMTP server. Check email credentials.",
        )
    except Exception as e:
        print(f"Failed to send email to {to_email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=schemas.JobApplicationResponse,
)
def create_job_application(
    application: schemas.JobApplicationCreate, db: Session = Depends(get_db)
):
    candidate = (
        db.query(models.Candidate)
        .filter(models.Candidate.email == application.candidate_email)
        .first()
    )
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
        )

    job = (
        db.query(models.JobPost).filter(models.JobPost.id == application.job_id).first()
    )
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

    existing_application = (
        db.query(models.JobApplication)
        .filter(
            models.JobApplication.candidate_email == application.candidate_email,
            models.JobApplication.job_id == application.job_id,
        )
        .first()
    )

    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied for this job",
        )

    db_application = models.JobApplication(**application.dict())
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return db_application


@router.get("/count/{email}", response_model=dict)
def get_application_count(email: str, db: Session = Depends(get_db)):
    candidate = (
        db.query(models.Candidate).filter(models.Candidate.email == email).first()
    )
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
        )

    count = (
        db.query(models.JobApplication)
        .filter(models.JobApplication.candidate_email == email)
        .count()
    )

    return {"count": count}


@router.get("/interviewer/{email}", response_model=List[dict])
def get_interviewer_applications(email: str, db: Session = Depends(get_db)):
    interviewer = (
        db.query(models.Interviewer).filter(models.Interviewer.email == email).first()
    )
    if not interviewer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Interviewer not found"
        )

    applications = (
        db.query(models.JobApplication)
        .filter(models.JobApplication.interviewer_email == email)
        .all()
    )

    result = []
    for app in applications:
        candidate = (
            db.query(models.Candidate)
            .filter(models.Candidate.email == app.candidate_email)
            .first()
        )
        job = db.query(models.JobPost).filter(models.JobPost.id == app.job_id).first()

        if candidate and job:
            result.append(
                {
                    "application_id": app.id,
                    "job_id": job.id,
                    "job_title": job.title,
                    "company": job.company,
                    "candidate_id": candidate.id,
                    "candidate_name": candidate.name,
                    "candidate_email": candidate.email,
                    "education": candidate.education,
                    "years_of_experience": candidate.years_of_experience,
                    "skills": candidate.skills,
                    "resume": candidate.resume,
                    "profile_image": candidate.profile_image,
                    "status": app.status,
                    "interview_form_url": app.interview_form_url,
                    "interview_schedule": app.interview_schedule,
                    "interview_duration": app.interview_duration,
                    "interview_title": app.interview_title,
                    "interview_description": app.interview_description,
                    "created_at": app.created_at,
                }
            )

    return result


@router.get("/shortlisted-candidate", response_model=schemas.PaginatedJobApplications)
def search_job_applications(
    search: Optional[str] = Query(
        None, description="Search by candidate name, job title, or company"
    ),
    status: Optional[str] = Query(
        "Shortlisted", description="Filter by application status"
    ),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Number of records per page"),
    db: Session = Depends(get_db),
):
    query = db.query(models.JobApplication)

    if status:
        if status not in ["Applied", "Shortlisted"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid status. Must be 'Applied', 'Shortlisted'",
            )
        query = query.filter(models.JobApplication.status == status)

    total_count = query.count()

    filtered_applications = []

    search_provided = search is not None and search.strip() != ""

    if search_provided:
        all_applications = query.all()
        search_term = search.lower()

        for app in all_applications:
            candidate = (
                db.query(models.Candidate)
                .filter(models.Candidate.email == app.candidate_email)
                .first()
            )
            job = (
                db.query(models.JobPost).filter(models.JobPost.id == app.job_id).first()
            )

            if candidate and job:
                if (
                    search_term in candidate.name.lower()
                    or search_term in job.title.lower()
                    or search_term in job.company.lower()
                ):
                    filtered_applications.append(
                        schemas.JobApplicationSearchResult(
                            application_id=app.id,
                            job_id=job.id,
                            job_title=job.title,
                            company=job.company,
                            candidate_name=candidate.name,
                            candidate_email=candidate.email,
                            interviewer_email=app.interviewer_email,
                            status=app.status,
                            interview_form_url=app.interview_form_url,
                            interview_schedule=app.interview_schedule,
                            interview_duration=app.interview_duration,
                            interview_title=app.interview_title,
                            interview_description=app.interview_description,
                            created_at=app.created_at,
                        )
                    )
    else:
        paginated_apps = query.offset((page - 1) * limit).limit(limit).all()

        for app in paginated_apps:
            candidate = (
                db.query(models.Candidate)
                .filter(models.Candidate.email == app.candidate_email)
                .first()
            )
            job = (
                db.query(models.JobPost).filter(models.JobPost.id == app.job_id).first()
            )

            if candidate and job:
                filtered_applications.append(
                    schemas.JobApplicationSearchResult(
                        application_id=app.id,
                        job_id=job.id,
                        job_title=job.title,
                        company=job.company,
                        candidate_name=candidate.name,
                        candidate_email=candidate.email,
                        interviewer_email=app.interviewer_email,
                        status=app.status,
                        interview_form_url=app.interview_form_url,
                        interview_schedule=app.interview_schedule,
                        interview_duration=app.interview_duration,
                        interview_title=app.interview_title,
                        interview_description=app.interview_description,
                        created_at=app.created_at,
                    )
                )

    if search_provided:
        total_filtered = len(filtered_applications)
        start_idx = (page - 1) * limit
        end_idx = min(start_idx + limit, total_filtered)
        paginated_results = filtered_applications[start_idx:end_idx]
        total_count = total_filtered
        total_pages = (total_filtered + limit - 1) // limit if total_filtered > 0 else 1
    else:
        paginated_results = filtered_applications
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1

    return schemas.PaginatedJobApplications(
        items=paginated_results,
        total=total_count,
        page=page,
        size=limit,
        pages=total_pages,
    )


@router.get("/{application_id}", response_model=dict)
def get_application(application_id: int, db: Session = Depends(get_db)):
    application = (
        db.query(models.JobApplication)
        .filter(models.JobApplication.id == application_id)
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )

    candidate = (
        db.query(models.Candidate)
        .filter(models.Candidate.email == application.candidate_email)
        .first()
    )

    job = (
        db.query(models.JobPost).filter(models.JobPost.id == application.job_id).first()
    )

    notes = (
        db.query(models.Note)
        .filter(models.Note.application_id == application_id)
        .order_by(models.Note.created_at.desc())
        .all()
    )

    response = {
        "id": application.id,
        "candidate_email": application.candidate_email,
        "job_id": application.job_id,
        "interviewer_email": application.interviewer_email,
        "status": application.status,
        "interview_form_url": application.interview_form_url,
        "interview_schedule": application.interview_schedule,
        "interview_duration": application.interview_duration,
        "interview_title": application.interview_title,
        "interview_description": application.interview_description,
        "created_at": application.created_at,
        "candidate_name": candidate.name if candidate else "Unknown",
        "candidate_resume": candidate.resume if candidate else None,
        "job_title": job.title if job else "Not specified",
        "company": job.company if job else "Not specified",
        "job_location": job.location if job else None,
        "job_type": job.type if job else None,
        "notes": [
            {
                "id": note.id,
                "content": note.content,
                "created_by": note.created_by,
                "created_at": note.created_at,
            }
            for note in notes
        ],
    }

    return response


@router.patch("/{application_id}", response_model=schemas.JobApplicationResponse)
def update_application_status(
    application_id: int,
    status_update: schemas.JobApplicationUpdate,
    db: Session = Depends(get_db),
):
    application = (
        db.query(models.JobApplication)
        .filter(models.JobApplication.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )

    if status_update.status not in ["Applied", "Shortlisted", "Rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status"
        )

    if status_update.status in ["Shortlisted", "Rejected"]:
        candidate = (
            db.query(models.Candidate)
            .filter(models.Candidate.email == application.candidate_email)
            .first()
        )
        job = (
            db.query(models.JobPost)
            .filter(models.JobPost.id == application.job_id)
            .first()
        )
        if candidate and job:
            send_email(
                to_email=candidate.email,
                candidate_name=candidate.name,
                job_title=job.title,
                company=job.company,
                status=status_update.status,
            )

    application.status = status_update.status
    if status_update.interview_form_url is not None:
        application.interview_form_url = status_update.interview_form_url
    if status_update.interview_schedule is not None:
        application.interview_schedule = status_update.interview_schedule
    if status_update.interview_duration is not None:
        application.interview_duration = status_update.interview_duration
    if status_update.interview_title is not None:
        application.interview_title = status_update.interview_title
    if status_update.interview_description is not None:
        application.interview_description = status_update.interview_description

    db.commit()
    db.refresh(application)
    return application


@router.post("/{application_id}/notes", response_model=schemas.NoteResponse)
def create_note(
    application_id: int, note: schemas.NoteCreate, db: Session = Depends(get_db)
):
    application = (
        db.query(models.JobApplication)
        .filter(models.JobApplication.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )

    # Validate that the note creator is the assigned interviewer
    if note.created_by != application.interviewer_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned interviewer can add notes for this application",
        )

    # Validate note content
    if not note.content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Note content cannot be empty",
        )
    if len(note.content) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Note content cannot exceed 1000 characters",
        )

    print(f"Received note payload: {note.dict()}")  # Debug log
    db_note = models.Note(
        application_id=application_id, content=note.content, created_by=note.created_by
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


@router.patch("/notes/{note_id}", response_model=schemas.NoteResponse)
def update_note(
    note_id: int, note_update: schemas.NoteUpdate, db: Session = Depends(get_db)
):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not db_note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    application = (
        db.query(models.JobApplication)
        .filter(models.JobApplication.id == db_note.application_id)
        .first()
    )
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )

    if note_update.created_by != application.interviewer_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned interviewer can update this note",
        )

    if not note_update.content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Note content cannot be empty",
        )
    if len(note_update.content) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Note content cannot exceed 1000 characters",
        )

    db_note.content = note_update.content.strip()
    db.commit()
    db.refresh(db_note)

    return db_note


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int, note_delete: schemas.NoteDelete, db: Session = Depends(get_db)
):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not db_note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    application = (
        db.query(models.JobApplication)
        .filter(models.JobApplication.id == db_note.application_id)
        .first()
    )
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )

    if note_delete.created_by != application.interviewer_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned interviewer can delete this note",
        )

    db.delete(db_note)
    db.commit()


@router.get("/check/{candidate_email}/{job_id}", response_model=dict)
def check_application(candidate_email: str, job_id: int, db: Session = Depends(get_db)):
    application = (
        db.query(models.JobApplication)
        .filter(
            models.JobApplication.candidate_email == candidate_email,
            models.JobApplication.job_id == job_id,
        )
        .first()
    )

    if application:
        return {"applied": True, "status": application.status}
    return {"applied": False, "status": None}


@router.get("/candidate/{email}", response_model=List[dict])
def get_candidate_applications(email: str, db: Session = Depends(get_db)):
    candidate = (
        db.query(models.Candidate).filter(models.Candidate.email == email).first()
    )
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
        )

    applications = (
        db.query(models.JobApplication)
        .filter(models.JobApplication.candidate_email == email)
        .all()
    )

    result = []
    for app in applications:
        job = db.query(models.JobPost).filter(models.JobPost.id == app.job_id).first()

        if job:
            result.append(
                {
                    "application_id": app.id,
                    "job_id": job.id,
                    "job_title": job.title,
                    "company": job.company,
                    "location": job.location,
                    "type": job.type,
                    "status": app.status,
                    "interview_form_url": app.interview_form_url,
                    "interview_schedule": app.interview_schedule,
                    "interview_duration": app.interview_duration,
                    "interview_title": app.interview_title,
                    "interview_description": app.interview_description,
                    "applied_date": app.created_at,
                }
            )

    return result
