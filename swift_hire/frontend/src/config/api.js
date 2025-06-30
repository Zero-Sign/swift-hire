// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
  },
  
  // Jobs
  JOBS: {
    LIST: `${API_BASE_URL}/job-posts`,
    BY_INTERVIEWER: (email) => `${API_BASE_URL}/job-posts/interviewer/${email}`,
    CREATE: `${API_BASE_URL}/job-posts`,
    UPDATE: (id) => `${API_BASE_URL}/job-posts/${id}`,
    DELETE: (id) => `${API_BASE_URL}/job-posts/${id}`,
  },
  
  // Job Applications
  APPLICATIONS: {
    LIST: `${API_BASE_URL}/job-applications`,
    BY_CANDIDATE: (email) => `${API_BASE_URL}/job-applications/candidate/${email}`,
    BY_INTERVIEWER: (email) => `${API_BASE_URL}/job-applications/interviewer/${email}`,
    SHORTLISTED: `${API_BASE_URL}/job-applications/shortlisted-candidate`,
    CREATE: `${API_BASE_URL}/job-applications`,
    UPDATE: (id) => `${API_BASE_URL}/job-applications/${id}`,
  },
  
  // Candidates
  CANDIDATES: {
    LIST: `${API_BASE_URL}/candidates`,
    RECOMMENDED_JOBS: (email) => `${API_BASE_URL}/candidates/${email}/recommended-jobs`,
    PROFILE: (email) => `${API_BASE_URL}/candidates/${email}`,
  },
  
  // Admin
  ADMIN: {
    USERS: `${API_BASE_URL}/api/admin/users`,
  },
  
  // Saved Jobs
  SAVED_JOBS: {
    BY_EMAIL: (email) => `${API_BASE_URL}/saved-jobs/${email}`,
  },
  
  // Feedback
  FEEDBACK: {
    CREATE: `${API_BASE_URL}/feedback`,
    LIST: `${API_BASE_URL}/feedback`,
  },
  
  // Calendar
  CALENDAR: {
    EVENTS: `${API_BASE_URL}/calendar/events`,
  },
};

export default API_BASE_URL;
