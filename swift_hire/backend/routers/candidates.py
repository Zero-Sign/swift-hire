import random
from typing import List, Optional

from database import get_db
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from models import Candidate, JobPost, SavedJob, User
from schemas import (
    CandidateResponse,
    JobPostResponse,
    LoginUserResponse,
    SavedJobResponse,
)
from sqlalchemy.orm import Session

router = APIRouter(tags=["candidates"])


# Register a candidate
@router.post("/register/candidate", response_model=LoginUserResponse)
async def register_candidate(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    skills: str = Form(...),
    bio: Optional[str] = Form(None),
    resume: UploadFile = File(...),
    profile_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    try:
        # Check if the email already exists in users table
        if db.query(User).filter(User.email == email).first():
            raise HTTPException(status_code=400, detail="Email already exists")

        # Check if email exists in candidates table
        if db.query(Candidate).filter(Candidate.email == email).first():
            raise HTTPException(status_code=400, detail="Email already exists")

        # Save the resume file
        safe_filename = f"{email}_resume_{resume.filename}".replace(" ", "_")
        resume_filename = f"uploads/{safe_filename}"

        try:
            with open(resume_filename, "wb") as buffer:
                buffer.write(await resume.read())
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error saving resume: {str(e)}"
            )

        # Default profile image path
        profile_image_filename = "/images/user.jpg"

        # If profile image is uploaded, save it
        if profile_image:
            safe_filename = f"{email}_profile_{profile_image.filename}".replace(
                " ", "_"
            )
            profile_image_filename = f"uploads/{safe_filename}"

            try:
                with open(profile_image_filename, "wb") as buffer:
                    buffer.write(await profile_image.read())
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"Error saving profile image: {str(e)}"
                )

        # Create user record - no created_at field
        user = User(
            name=name,
            email=email,
            password=password,
            role="Candidate",
        )
        db.add(user)
        db.flush()  # Flush changes to DB to get user ID but don't commit yet

        # Create candidate record with new fields
        candidate = Candidate(
            name=name,
            email=email,
            skills=skills,
            bio=bio,
            resume=resume_filename,
            profile_image=profile_image_filename,
            role="Candidate",
        )
        db.add(candidate)
        db.commit()  # Commit both records

        return LoginUserResponse(name=user.name, email=user.email, role=user.role)

    except Exception as e:
        db.rollback()  # Roll back any changes if error occurs
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Error registering candidate: {str(e)}"
        )


# Get candidate profile by email
@router.get("/candidates/{email}", response_model=CandidateResponse)
async def get_candidate(email: str, db: Session = Depends(get_db)):
    try:
        candidate = db.query(Candidate).filter(Candidate.email == email).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return candidate
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Error fetching candidate: {str(e)}"
        )


# Update candidate profile
@router.put("/candidates/{email}", response_model=CandidateResponse)
async def update_candidate(
    email: str,
    name: str = Form(...),
    skills: str = Form(...),
    bio: Optional[str] = Form(None),
    education: Optional[str] = Form("Not Specified"),
    years_of_experience: Optional[int] = Form(0),
    resume: Optional[UploadFile] = File(None),
    profile_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    try:
        # Find candidate by email
        candidate = db.query(Candidate).filter(Candidate.email == email).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Update candidate information
        candidate.name = name
        candidate.skills = skills
        candidate.education = education
        candidate.years_of_experience = years_of_experience

        # Update bio if provided
        if bio is not None:
            candidate.bio = bio
        # Also update user info
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.name = name

        # If new resume is uploaded, save it
        if resume:
            # Keep the original filename but ensure it's unique
            resume_filename = f"uploads/{email}_resume_{resume.filename}"

            try:
                with open(resume_filename, "wb") as buffer:
                    buffer.write(await resume.read())
                candidate.resume = resume_filename
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"Error saving resume: {str(e)}"
                )

        # If new profile image is uploaded, save it
        if profile_image:
            # Keep the original filename but ensure it's unique
            profile_image_filename = f"uploads/{profile_image.filename}"

            try:
                with open(profile_image_filename, "wb") as buffer:
                    buffer.write(await profile_image.read())
                candidate.profile_image = profile_image_filename
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"Error saving profile image: {str(e)}"
                )

        db.commit()
        db.refresh(candidate)
        return candidate
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Error updating candidate: {str(e)}"
        )


# Get recommended jobs for a candidate
@router.get(
    "/candidates/{email}/recommended-jobs", response_model=List[JobPostResponse]
)
async def get_recommended_jobs(email: str, db: Session = Depends(get_db)):
    try:
        # First get the candidate to check their skills
        candidate = db.query(Candidate).filter(Candidate.email == email).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Get all jobs
        all_jobs = db.query(JobPost).order_by(JobPost.created_at.desc()).all()

        # If no jobs exist, return empty list
        if not all_jobs:
            return []

        # Parse the candidate's skills
        candidate_skills = [s.strip().lower() for s in candidate.skills.split(",")]

        # Calculate job matches based on skills
        matching_jobs = []
        for job in all_jobs:
            job_skills = [s.strip().lower() for s in job.skills.split(",")]
            # Check for any skill match
            matches = False
            for c_skill in candidate_skills:
                for j_skill in job_skills:
                    if c_skill in j_skill or j_skill in c_skill:
                        matches = True
                        break
                if matches:
                    break

            if matches:
                matching_jobs.append(job)

        # If we have matching jobs, return them (up to 3)
        if matching_jobs:
            return matching_jobs[:3]

        # If no matches, return 3 random jobs
        return random.sample(all_jobs, min(3, len(all_jobs)))

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Error fetching recommended jobs: {str(e)}"
        )


# Endpoint to save a job to wishlist
@router.post("/saved-jobs", response_model=SavedJobResponse)
async def save_job(
    candidate_email: str = Form(...),
    job_id: int = Form(...),
    db: Session = Depends(get_db),
):
    try:
        # Check if job is already saved
        existing = (
            db.query(SavedJob)
            .filter(
                SavedJob.candidate_email == candidate_email, SavedJob.job_id == job_id
            )
            .first()
        )

        if existing:
            raise HTTPException(status_code=400, detail="Job already saved")

        saved_job = SavedJob(candidate_email=candidate_email, job_id=job_id)
        db.add(saved_job)
        db.commit()
        db.refresh(saved_job)
        return saved_job
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error saving job: {str(e)}")


# Remove a job from wishlist
@router.delete("/saved-jobs/{candidate_email}/{job_id}")
async def unsave_job(candidate_email: str, job_id: int, db: Session = Depends(get_db)):
    try:
        # Find the saved job record
        saved_job = (
            db.query(SavedJob)
            .filter(
                SavedJob.candidate_email == candidate_email, SavedJob.job_id == job_id
            )
            .first()
        )

        if not saved_job:
            raise HTTPException(status_code=404, detail="Saved job not found")

        # Delete the record
        db.delete(saved_job)
        db.commit()

        return {"message": "Job unsaved successfully"}
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error unsaving job: {str(e)}")


# Get all saved jobs for a candidate
@router.get("/saved-jobs/{email}", response_model=List[JobPostResponse])
async def get_saved_jobs(email: str, db: Session = Depends(get_db)):
    try:
        # Get all saved job IDs for the candidate
        saved_job_records = (
            db.query(SavedJob).filter(SavedJob.candidate_email == email).all()
        )
        job_ids = [record.job_id for record in saved_job_records]

        # Get job details for all saved jobs
        if job_ids:
            saved_jobs = db.query(JobPost).filter(JobPost.id.in_(job_ids)).all()
            return saved_jobs
        return []
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching saved jobs: {str(e)}"
        )


# Count saved jobs for a candidate
@router.get("/saved-jobs/count/{email}")
async def count_saved_jobs(email: str, db: Session = Depends(get_db)):
    try:
        count = db.query(SavedJob).filter(SavedJob.candidate_email == email).count()
        return {"count": count}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error counting saved jobs: {str(e)}"
        )


# Get all candidates
@router.get("/candidates", response_model=List[CandidateResponse])
async def get_all_candidates(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    try:
        candidates = db.query(Candidate).offset(skip).limit(limit).all()
        return candidates
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching candidates: {str(e)}"
        )


# Filter candidates by skills
@router.get("/candidates/filter", response_model=List[CandidateResponse])
async def filter_candidates_by_skills(
    skills: str,  # Comma-separated skills
    db: Session = Depends(get_db),
):
    try:
        if not skills:
            candidates = db.query(Candidate).all()
            return candidates

        skill_list = [skill.strip().lower() for skill in skills.split(",")]
        filtered_candidates = []
        all_candidates = db.query(Candidate).all()

        for candidate in all_candidates:
            candidate_skills = candidate.skills.lower()
            if any(skill in candidate_skills for skill in skill_list):
                filtered_candidates.append(candidate)

        return filtered_candidates
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error filtering candidates: {str(e)}"
        )
