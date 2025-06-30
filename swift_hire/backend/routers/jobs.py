from typing import List

from database import get_db
from fastapi import APIRouter, Depends, Form, HTTPException
from models import JobApplication, JobPost
from schemas import JobPostResponse
from sqlalchemy.orm import Session

router = APIRouter(tags=["jobs"])


# Create a job post
@router.post("/job-posts", response_model=JobPostResponse)
async def create_job_post(
    title: str = Form(...),
    company: str = Form(...),
    location: str = Form(...),
    type: str = Form(...),
    salary: str = Form(...),
    description: str = Form(...),
    skills: str = Form(...),
    interviewer_email: str = Form(...),
    db: Session = Depends(get_db),
):
    try:
        job_post = JobPost(
            title=title,
            company=company,
            location=location,
            type=type,
            salary=salary,
            description=description,
            skills=skills,
            interviewer_email=interviewer_email,
        )
        db.add(job_post)
        db.commit()
        db.refresh(job_post)
        return job_post
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error creating job post: {str(e)}"
        )


# Get all job posts
@router.get("/job-posts", response_model=List[JobPostResponse])
async def get_job_posts(db: Session = Depends(get_db)):
    try:
        job_posts = db.query(JobPost).order_by(JobPost.created_at.desc()).all()
        return job_posts
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching job posts: {str(e)}"
        )


# Get a specific job post by ID
@router.get("/job-posts/{job_id}", response_model=JobPostResponse)
async def get_job_post(job_id: int, db: Session = Depends(get_db)):
    try:
        job_post = db.query(JobPost).filter(JobPost.id == job_id).first()
        if not job_post:
            raise HTTPException(status_code=404, detail="Job post not found")
        return job_post
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Error fetching job post: {str(e)}"
        )


# Add a new endpoint to get jobs by interviewer email
@router.get("/job-posts/interviewer/{email}", response_model=List[JobPostResponse])
async def get_interviewer_job_posts(email: str, db: Session = Depends(get_db)):
    try:
        job_posts = (
            db.query(JobPost)
            .filter(JobPost.interviewer_email == email)
            .order_by(JobPost.created_at.desc())
            .all()
        )
        return job_posts
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching job posts: {str(e)}"
        )


@router.get("/interviewer/{email}")
def get_interviewer_jobs(email: str, db: Session = Depends(get_db)):
    """
    Get all job posts created by a specific interviewer
    """
    jobs = db.query(JobPost).filter(JobPost.interviewer_email == email).all()
    return jobs


@router.delete("/job-posts/{job_id}", response_model=dict)
def delete_job_post(job_id: int, db: Session = Depends(get_db)):
    """
    Delete a job post by its ID and remove any associated job applications
    """
    # Check if job exists
    job = db.query(JobPost).filter(JobPost.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job post not found")

    # Find all applications for this job to delete them
    applications = (
        db.query(JobApplication).filter(JobApplication.job_id == job_id).all()
    )

    # Delete all applications for this job
    for application in applications:
        db.delete(application)

    # Delete the job
    db.delete(job)
    db.commit()

    return {
        "message": f"Job post and {len(applications)} associated applications deleted successfully"
    }
