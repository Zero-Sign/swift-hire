# Swift Hire - Job Recruitment Platform

A comprehensive job recruitment and interview management platform built with React and FastAPI.

## 🏗️ Architecture

- **Frontend**: React 19 with React Router, Bootstrap, Tailwind CSS
- **Backend**: FastAPI with SQLAlchemy ORM
- **Database**: PostgreSQL
- **File Storage**: Local file system for uploads

## 📁 Project Structure

```
swift_hire/
├── backend/                 # FastAPI backend
│   ├── routers/            # API route modules
│   ├── models.py           # Database models
│   ├── schemas.py          # Pydantic schemas
│   ├── database.py         # DB configuration
│   ├── main.py            # FastAPI app entry point
│   ├── requirements.txt   # Python dependencies
│   ├── .env               # Environment variables
│   └── uploads/           # File storage
├── frontend/              # React frontend (renamed from swifthire)
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   └── App.js         # Main app component
│   ├── package.json
│   └── public/
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 12+

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd swift_hire/backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. Start the backend server:
   ```bash
   python main.py
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd swift_hire/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## 🎯 Features

### For Candidates
- User registration with resume/profile image upload
- Browse available job postings
- Apply for jobs
- Personal dashboard
- Profile management

### For Interviewers
- Post new job openings
- View and filter candidate applications
- Conduct interviews with integrated tools
- Provide feedback on candidates
- Calendar management for interviews

### For Admins
- User management
- Platform oversight
- Application monitoring

## 🔧 API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

## 🗄️ Database Setup

1. Create a PostgreSQL database named `swift_hire`
2. Update the `DATABASE_URL` in your `.env` file
3. The application will automatically create the required tables on startup

## 📝 Environment Variables

See `.env.example` for all available configuration options.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
