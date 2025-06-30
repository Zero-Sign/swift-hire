from typing import List, Optional

from database import get_db
from fastapi import APIRouter, Depends, HTTPException, Query
from models import Candidate, Interviewer, User
from schemas import UserCreate, UserResponse, UserUpdate
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/admin", tags=["admin"])


# Get all users with optional filtering
@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    name: Optional[str] = Query(None, description="Filter by name (partial match)"),
    role: Optional[str] = Query(
        None, description="Filter by role (Candidate or Interviewer)"
    ),
    db: Session = Depends(get_db),
):
    try:
        query = db.query(User)

        # Apply name filter if provided (case insensitive partial match)
        if name:
            query = query.filter(User.name.ilike(f"%{name}%"))

        # Apply role filter if provided
        if role and role.lower() in ["candidate", "interviewer"]:
            query = query.filter(User.role == role.capitalize())

        users = query.all()

        # Convert users to UserResponse format
        user_responses = [
            UserResponse(id=user.id, name=user.name, email=user.email, role=user.role)
            for user in users
        ]
        return user_responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving users: {str(e)}")


# Get user by ID
@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return UserResponse(
            id=user.id, name=user.name, email=user.email, role=user.role
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving user: {str(e)}")


# Create new user (updated code for admin.py)
@router.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Validate role
        if user.role not in ["Candidate", "Interviewer"]:
            raise HTTPException(
                status_code=400,
                detail="Role must be either 'Candidate' or 'Interviewer'",
            )

        # Create new user
        new_user = User(
            name=user.name,
            email=user.email,
            password=user.password,  # In production, you should hash this
            role=user.role,
        )

        db.add(new_user)

        # If role is Candidate, also create entry in candidates table
        if user.role == "Candidate":
            # Create a basic candidate record
            new_candidate = Candidate(
                name=user.name,
                email=user.email,
                skills="",  # Empty skills to start
                resume="uploads/default_resume.pdf",  # Default resume path
                profile_image="/images/user.jpg",  # Default profile image
                bio=None,
                role="Candidate",
            )
            db.add(new_candidate)

        # If role is Interviewer, also create entry in interviewers table
        elif user.role == "Interviewer":
            # Create a basic interviewer record
            new_interviewer = Interviewer(
                name=user.name,
                email=user.email,
                expertise="",  # Empty expertise to start
                availability="",  # Empty availability to start
                department="",  # Empty department to start
                role="Interviewer",
            )
            db.add(new_interviewer)

        db.commit()
        db.refresh(new_user)

        return UserResponse(
            id=new_user.id, name=new_user.name, email=new_user.email, role=new_user.role
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")


# Update user
@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)
):
    try:
        # Find user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if email already exists (if changing email)
        if user_update.email != user.email:
            existing_user = (
                db.query(User).filter(User.email == user_update.email).first()
            )
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already registered")

        # Validate role
        if user_update.role not in ["Candidate", "Interviewer"]:
            raise HTTPException(
                status_code=400,
                detail="Role must be either 'Candidate' or 'Interviewer'",
            )

        # Update user fields
        user.name = user_update.name
        user.email = user_update.email
        user.role = user_update.role

        # Commit changes
        db.commit()
        db.refresh(user)

        return UserResponse(
            id=user.id, name=user.name, email=user.email, role=user.role
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")


# Delete user
@router.delete("/users/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    try:
        # Find user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Delete user
        db.delete(user)
        db.commit()

        return {"message": "User deleted successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")
