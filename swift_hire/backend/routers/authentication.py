from database import get_db
from fastapi import APIRouter, Depends, Form, HTTPException
from models import User
from schemas import LoginUserResponse
from sqlalchemy.orm import Session

router = APIRouter(tags=["authentication"])


# Login endpoint
@router.post("/login", response_model=LoginUserResponse)
async def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    try:
        # Find user by email
        user = db.query(User).filter(User.email == email).first()

        # Check if user exists and password matches
        if not user or user.password != password:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        return LoginUserResponse(name=user.name, email=user.email, role=user.role)

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")
