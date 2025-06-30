from database import get_db
from fastapi import APIRouter, Depends, Form, HTTPException
from models import Interviewer, User
from schemas import LoginUserResponse
from sqlalchemy.orm import Session

router = APIRouter(tags=["interviewers"])


# Register an interviewer
@router.post("/register/interviewer", response_model=LoginUserResponse)
async def register_interviewer(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    expertise: str = Form(...),
    availability: str = Form(...),
    department: str = Form(...),
    db: Session = Depends(get_db),
):
    try:
        # Check if email already exists in users table
        if db.query(User).filter(User.email == email).first():
            raise HTTPException(status_code=400, detail="Email already exists")

        # Check if email exists in interviewers table
        if db.query(Interviewer).filter(Interviewer.email == email).first():
            raise HTTPException(status_code=400, detail="Email already exists")

        # Create user record - no created_at field
        user = User(
            name=name,
            email=email,
            password=password,
            role="Interviewer",
        )
        db.add(user)
        db.flush()  # Flush to get user ID without committing

        # Create interviewer record
        interviewer = Interviewer(
            name=name,
            email=email,
            expertise=expertise,
            availability=availability,
            department=department,
            role="Interviewer",
        )
        db.add(interviewer)
        db.commit()

        return LoginUserResponse(name=user.name, email=user.email, role=user.role)

    except Exception as e:
        db.rollback()  # Roll back any changes if error occurs
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Error registering interviewer: {str(e)}"
        )
