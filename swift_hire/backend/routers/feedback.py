from typing import List, Optional

from database import get_db
from fastapi import APIRouter, Depends, Form, HTTPException, status
from models import Feedback
from schemas import FeedbackCreate, FeedbackResponse
from sqlalchemy.orm import Session

router = APIRouter(tags=["feedback"])


@router.post(
    "/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED
)
async def create_feedback(
    # Accept either JSON body or form data
    feedback: Optional[FeedbackCreate] = None,
    # Form fields for FormData submissions
    rating: Optional[int] = Form(None),
    message: Optional[str] = Form(None),
    user_email: Optional[str] = Form(None),
    user_name: Optional[str] = Form(None),
    user_role: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Create a new feedback entry - supports both JSON and form data
    """
    # If form data is provided, use it
    if (
        rating is not None
        and message is not None
        and user_email is not None
        and user_name is not None
        and user_role is not None
    ):
        # Validate the rating
        if not 1 <= rating <= 5:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Rating must be between 1 and 5",
            )

        # Validate the message length
        if len(message) > 300:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Message must be 300 characters or less",
            )

        db_feedback = Feedback(
            rating=rating,
            message=message,
            user_email=user_email,
            user_name=user_name,
            user_role=user_role,
        )
    # If JSON data is provided in the request body, use that
    elif feedback is not None:
        db_feedback = Feedback(
            user_email=feedback.user_email,
            user_name=feedback.user_name,
            user_role=feedback.user_role,
            rating=feedback.rating,
            message=feedback.message,
        )
    # If neither is provided, return an error
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either form data or JSON body must be provided",
        )

    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


@router.get("/feedback", response_model=List[FeedbackResponse])
def get_all_feedback(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve all feedback entries
    """
    return db.query(Feedback).offset(skip).limit(limit).all()


@router.get("/feedback/{feedback_id}", response_model=FeedbackResponse)
def get_feedback(feedback_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific feedback by ID
    """
    db_feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return db_feedback


@router.get("/feedback/{user_email}", response_model=List[FeedbackResponse])
def get_user_feedback(user_email: str, db: Session = Depends(get_db)):
    """
    Retrieve all feedback from a specific user
    """
    feedback_list = db.query(Feedback).filter(Feedback.user_email == user_email).all()
    return feedback_list


@router.delete("feedback/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feedback(feedback_id: int, db: Session = Depends(get_db)):
    """
    Delete a feedback entry
    """
    db_feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")

    db.delete(db_feedback)
    db.commit()
    return None
