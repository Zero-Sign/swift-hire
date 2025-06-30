import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./ApplicationsPage.css";

function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (userData && userData.email) {
      fetchApplications(userData.email);
    } else {
      setError("Please log in to view your applications");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchApplications = async (email) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/job-applications/candidate/${email}`);
      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }
      
      const data = await response.json();
      setApplications(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setError("Failed to load applications. Please try again later.");
      setLoading(false);
    }
  };

  const isInterviewScheduled = (app) => {
    return app.status === "Shortlisted" && app.interview_form_url && app.interview_schedule;
  };

  const getInterviewStatus = (app) => {
    if (!isInterviewScheduled(app)) {
      return { status: "not_scheduled", message: "Not scheduled yet" };
    }

    const interviewTime = new Date(app.interview_schedule);
    const durationMs = (app.interview_duration || 30) * 60 * 1000;
    const joinWindowStart = new Date(interviewTime.getTime() - 5 * 60 * 1000);
    const interviewEnd = new Date(interviewTime.getTime() + durationMs);

    if (currentTime >= interviewEnd) {
      return { status: "completed", message: "Interview completed" };
    } else if (currentTime >= joinWindowStart && currentTime < interviewEnd) {
      return { status: "joinable", message: "", interviewTime };
    } else if (currentTime < joinWindowStart) {
      return { status: "upcoming", message: "", interviewTime };
    }
  };

  const formatCountdown = (interviewTime) => {
    const diffMs = interviewTime - currentTime;
    if (diffMs <= 0) return "00:00:00";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const filteredApplications = () => {
    if (filterStatus === "All") {
      return applications;
    } else if (filterStatus === "Interviews") {
      return applications.filter(app => isInterviewScheduled(app));
    } else {
      return applications.filter(app => app.status === filterStatus);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Applied":
        return "status-applied";
      case "Shortlisted":
        return "status-shortlisted";
      case "Rejected":
        return "status-rejected";
      default:
        return "";
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not scheduled";
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  return (
    <div className="applications-container">
      <header className="applications-header">
        <h1>My Applications</h1>
        <p>Track the status of your job applications and interviews</p>
        
        <div className="filter-controls">
          <span>Filter by status:</span>
          <div className="status-filter">
            <button 
              className={filterStatus === "All" ? "active" : ""} 
              onClick={() => setFilterStatus("All")}
            >
              All
            </button>
            <button 
              className={filterStatus === "Applied" ? "active" : ""} 
              onClick={() => setFilterStatus("Applied")}
            >
              Applied
            </button>
            <button 
              className={filterStatus === "Shortlisted" ? "active" : ""} 
              onClick={() => setFilterStatus("Shortlisted")}
            >
              Shortlisted
            </button>
            <button 
              className={filterStatus === "Interviews" ? "active" : ""} 
              onClick={() => setFilterStatus("Interviews")}
            >
              Interviews
            </button>
            <button 
              className={filterStatus === "Rejected" ? "active" : ""} 
              onClick={() => setFilterStatus("Rejected")}
            >
              Rejected
            </button>
          </div>
        </div>
      </header>

      <div className="applications-content">
        {loading ? (
          <div className="loading">Loading applications...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredApplications().length === 0 ? (
          <div className="no-applications">
            {filterStatus === "All" 
              ? "You haven't applied to any jobs yet."
              : filterStatus === "Interviews"
                ? "You don't have any scheduled interviews."
                : `No applications with status "${filterStatus}".`}
            {filterStatus === "All" && (
              <Link to="/browse-jobs" className="browse-jobs-btn">
                Browse Jobs
              </Link>
            )}
          </div>
        ) : (
          <div className="applications-list">
            {filteredApplications().map(app => {
              const interviewStatus = getInterviewStatus(app);
              
              return (
                <div key={app.application_id} className="application-card">
                  <div className="card-header">
                    <div className="interview-status">
                      {interviewStatus.status === "upcoming" && (
                        <span className="countdown">
                          Starts in {formatCountdown(interviewStatus.interviewTime) } hr.
                        </span>
                      )}
                      {interviewStatus.status === "joinable" && (
                        <a 
                          href={app.interview_form_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="join-interview-btn"
                        >
                          Join Interview
                        </a>
                      )}
                      {interviewStatus.status === "completed" && (
                        <span className="completed">{interviewStatus.message}</span>
                      )}
                      {interviewStatus.status === "not_scheduled" && (
                        <span className="not-scheduled">{interviewStatus.message}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="card-content">
                    <div className="job-info">
                      <h3>{app.job_title}</h3>
                      <p className="company">{app.company}</p>
                      <div className="job-details">
                        <span className="location">{app.location}</span>
                        <span className="job-type">{app.type}</span>
                      </div>
                    </div>
                    <div className="application-meta">
                      <div className={`status ${getStatusClass(app.status)}`}>
                        {app.status}
                      </div>
                      <div className="applied-date">
                        Applied on {formatDate(app.applied_date)}
                      </div>
                      {isInterviewScheduled(app) && (
                        <div className="interview-details">
                          <p><strong>Schedule:</strong> {formatDateTime(app.interview_schedule)}</p>
                          <p><strong>Duration:</strong> {app.interview_duration ? `${app.interview_duration} minutes` : "Not specified"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <Link to="/candidate-dashboard" className="back-btn">
        Back to Dashboard
      </Link>
    </div>
  );
}

export default ApplicationsPage;