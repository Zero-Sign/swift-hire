import os
from pathlib import Path
from dotenv import load_dotenv

from database import Base, engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load environment variables
load_dotenv()
from routers import (
    admin_routes,
    authentication,
    calendar,
    candidates,
    feedback,
    interviewers,
    job_applications,
    jobs,
)

app = FastAPI()

# Add CORS middleware to handle cross-origin requests
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
origins = [
    frontend_url,  # React frontend
    "http://localhost:3000",  # Fallback
    "*",  # Allows all origins, change this in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables in the database
Base.metadata.create_all(bind=engine)

# Create uploads directory if it doesn't exist
upload_dir = os.getenv("UPLOAD_DIR", "uploads")
uploads_dir = Path(upload_dir)
uploads_dir.mkdir(exist_ok=True)

# Mount the uploads directory
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Add a simple root endpoint for testing
@app.get("/")
async def root():
    return {"message": "Swift Hire API is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is working properly"}

# Include routers
app.include_router(authentication.router)
app.include_router(jobs.router)
app.include_router(candidates.router)
app.include_router(interviewers.router)
app.include_router(job_applications.router)
app.include_router(feedback.router)  # Include the feedback router
app.include_router(admin_routes.router)
app.include_router(calendar.router)  # Add our new calendar routes


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "True").lower() == "true"

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info" if not debug else "debug"
    )
