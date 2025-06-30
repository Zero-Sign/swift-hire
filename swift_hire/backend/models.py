# models.py - Add InterviewQuestion model
from sqlalchemy import (
    TIMESTAMP,
    Column,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(Enum("Candidate", "Interviewer", name="roleenum"), nullable=False)
    # No created_at column in users table


class Interviewer(Base):
    __tablename__ = "interviewers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    expertise = Column(Text, nullable=False)
    availability = Column(Text, nullable=False)
    department = Column(String(255), nullable=False)
    role = Column(
        Enum("Candidate", "Interviewer", name="roleenum"),
        nullable=False,
        default="Interviewer",
    )
    created_at = Column(TIMESTAMP, server_default=func.now())


class JobPost(Base):
    __tablename__ = "job_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    salary = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    skills = Column(Text, nullable=False)
    interviewer_email = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    skills = Column(Text, nullable=False)
    resume = Column(String(255), nullable=False)
    profile_image = Column(String(255), nullable=True, default="/images/user.jpg")
    bio = Column(Text, nullable=True)
    education = Column(
        Enum(
            "Not Specified",
            "MATRIC",
            "INTERMEDIATE",
            "Bachelor's",
            "Master",
            "PHD",
            name="educationenum",
        ),
        nullable=False,
        default="Not Specified",
    )
    years_of_experience = Column(Integer, nullable=True, default=0)
    role = Column(
        Enum("Candidate", "Interviewer", name="roleenum"),
        nullable=False,
        default="Candidate",
    )
    created_at = Column(TIMESTAMP, server_default=func.now())


class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id = Column(Integer, primary_key=True, index=True)
    candidate_email = Column(String(255), nullable=False)
    job_id = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    candidate_email = Column(String(255), nullable=False)
    job_id = Column(Integer, nullable=False)
    interviewer_email = Column(String(255), nullable=False)
    status = Column(
        Enum("Applied", "Shortlisted", "Rejected", name="application_status"),
        default="Applied",
    )
    interview_form_url = Column(String(255), nullable=True)  # Meeting/Google Meet URL
    interview_schedule = Column(TIMESTAMP, nullable=True)  # Meeting start time
    interview_duration = Column(Integer, nullable=True)  # Meeting duration in minutes
    interview_title = Column(String(255), nullable=True)  # Meeting title
    interview_description = Column(Text, nullable=True)  # Meeting description
    created_at = Column(TIMESTAMP, server_default=func.now())


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(
        String(255), nullable=False
    )  # Email of the user providing feedback
    user_name = Column(
        String(255), nullable=False
    )  # Name of the user providing feedback
    user_role = Column(String(50), nullable=False)  # Role: "Candidate" or "Interviewer"
    rating = Column(Integer, nullable=False)  # Rating from 1-5
    message = Column(Text, nullable=False)  # Feedback message
    created_at = Column(TIMESTAMP, server_default=func.now())


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("job_applications.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_by = Column(
        String(255), nullable=False
    )  # Email of user who created the note
    created_at = Column(TIMESTAMP, server_default=func.now())
