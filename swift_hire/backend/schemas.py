from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class LoginUserBase(BaseModel):
    name: str
    email: str


class LoginUserCreate(LoginUserBase):
    password: str
    role: str


class LoginUserResponse(BaseModel):
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    name: str
    email: str
    role: str


class UserCreate(UserBase):
    password: str


class UserUpdate(UserBase):
    pass


class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True


class CandidateBase(BaseModel):
    name: str
    email: str
    skills: Optional[str] = None
    role: Optional[str] = "candidate"
    education: Optional[str] = "Not Specified"
    years_of_experience: Optional[int] = 0


class CandidateCreate(CandidateBase):
    pass


class CandidateResponse(CandidateBase):
    id: int
    resume: Optional[str] = None
    profile_image: Optional[str] = "/images/user.jpg"
    bio: Optional[str] = None
    education: Optional[str] = "Not Specified"
    years_of_experience: Optional[int] = 0

    class Config:
        from_attributes = True


class InterviewerBase(BaseModel):
    name: str
    email: str
    expertise: Optional[str] = None
    availability: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = "interviewer"


class InterviewerCreate(InterviewerBase):
    pass


class InterviewerResponse(InterviewerBase):
    id: int

    class Config:
        from_attributes = True


class JobPostBase(BaseModel):
    title: str
    company: str
    location: str
    type: str
    salary: str
    description: str
    skills: str


class JobPostCreate(JobPostBase):
    pass


class JobPostResponse(JobPostBase):
    id: int
    interviewer_email: str
    created_at: datetime

    class Config:
        from_attributes = True


class SavedJobBase(BaseModel):
    candidate_email: str
    job_id: int


class SavedJobResponse(SavedJobBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class InterviewQuestionBase(BaseModel):
    form_url: str
    form_title: str
    description: Optional[str] = None


class InterviewQuestionCreate(InterviewQuestionBase):
    application_id: int


class InterviewQuestionResponse(InterviewQuestionBase):
    id: int
    application_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class JobApplicationBase(BaseModel):
    candidate_email: str
    job_id: int
    interviewer_email: str


class JobApplicationCreate(JobApplicationBase):
    pass


class JobApplicationUpdate(BaseModel):
    status: str
    interview_form_url: Optional[str] = None
    interview_schedule: Optional[str] = None  # Accept string from frontend
    interview_duration: Optional[int] = None
    interview_title: Optional[str] = None
    interview_description: Optional[str] = None

    class Config:
        from_attributes = True


class JobApplicationResponse(JobApplicationBase):
    id: int
    status: str
    interview_form_url: Optional[str] = None
    interview_schedule: Optional[datetime] = None  # Return datetime
    interview_duration: Optional[int] = None
    interview_title: Optional[str] = None
    interview_description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FeedbackBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    message: str = Field(..., max_length=300)


class FeedbackCreate(FeedbackBase):
    user_email: EmailStr
    user_name: str
    user_role: str


class FeedbackResponse(FeedbackBase):
    id: int
    user_email: EmailStr
    user_name: str
    user_role: str
    created_at: datetime

    class Config:
        from_attributes = True


class JobApplicationSearchResult(BaseModel):
    application_id: int
    job_id: int
    job_title: str
    company: str
    candidate_name: str
    candidate_email: str
    interviewer_email: Optional[str] = None
    status: str
    interview_form_url: Optional[str] = None
    interview_schedule: Optional[datetime] = None
    interview_duration: Optional[int] = None
    interview_title: Optional[str] = None
    interview_description: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


class PaginatedJobApplications(BaseModel):
    items: List[JobApplicationSearchResult]
    total: int
    page: int
    size: int
    pages: int


class CalendarInviteRequest(BaseModel):
    candidate_email: str
    interviewer_email: Optional[str] = None
    summary: str
    description: str
    start_time: str
    end_time: str
    timezone: str
    meet_link: str


class NoteBase(BaseModel):
    content: str
    created_by: EmailStr


class NoteCreate(NoteBase):
    application_id: int


class NoteUpdate(BaseModel):
    content: str
    created_by: EmailStr


class NoteDelete(BaseModel):
    created_by: EmailStr


class NoteResponse(NoteBase):
    id: int
    application_id: int
    created_at: datetime

    class Config:
        orm_mode = True
