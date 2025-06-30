import React, { useState, useEffect } from "react";
import { Search, MapPin, Clock, DollarSign, Briefcase } from "lucide-react";
import "./BrowseJobs.css";

function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [userData, setUserData] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState({});
  const [savedJobs, setSavedJobs] = useState([]);
  const [applyingJob, setApplyingJob] = useState(null);
  const [applyStatus, setApplyStatus] = useState({ message: "", type: "" });
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savingJob, setSavingJob] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ message: "", type: "" });

  // Check if a job is saved - moved up to fix the initialization error
  const isJobSaved = (jobId) => {
    return savedJobs.some(job => job.id === jobId);
  };

  // Check URL for saved jobs parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const savedParam = urlParams.get('saved');
    if (savedParam === 'true') {
      setShowSavedOnly(true);
    }
  }, []);

  // Fetch jobs data from API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/job-posts`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setJobs(data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch jobs: " + err.message);
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
    
    // Get user data
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);
      
      // If user is a candidate, fetch their applications
      if (parsedUserData.role === "Candidate") {
        fetchCandidateApplications(parsedUserData.email);
        fetchSavedJobs(parsedUserData.email);
      }
    }
  }, []);
  
  // Fetch candidate's applications
  const fetchCandidateApplications = async (email) => {
    try {
      const response = await fetch(`http://localhost:8000/job-applications/candidate/${email}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const applications = await response.json();
      
      // Create a map of job_id -> status
      const jobStatusMap = {};
      applications.forEach(app => {
        jobStatusMap[app.job_id] = app.status;
      });
      
      setAppliedJobs(jobStatusMap);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  // Fetch saved jobs
  const fetchSavedJobs = async (email) => {
    try {
      const response = await fetch(`http://localhost:8000/saved-jobs/${email}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const savedJobsData = await response.json();
      setSavedJobs(savedJobsData);
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
    }
  };

  // Filter jobs based on search, type filter, saved only, and not applied
  const filteredJobs = jobs.filter(job => {
    // Filter by search terms
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by job type
    const matchesType = selectedType === "all" || job.type === selectedType;
    
    // Filter for saved jobs if showSavedOnly is true
    const isSaved = isJobSaved(job.id);
    
    // If we're showing saved jobs only, include regardless of application status
    if (showSavedOnly) {
      return matchesSearch && matchesType && isSaved;
    }
    
    // Otherwise, only show jobs that haven't been applied to
    const notApplied = !appliedJobs[job.id];
    return matchesSearch && matchesType && notApplied;
  });

  // Parse skills string into array
  const getSkillsArray = (skillsString) => {
    return skillsString.split(',').map(skill => skill.trim());
  };

  // Format date
  const formatPostedDate = (dateString) => {
    const postDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - postDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
  };
  
  // Handle job application
  const handleApplyJob = async (jobId, interviewerEmail) => {
    if (!userData || userData.role !== "Candidate") {
      alert("Please login as a candidate to apply for jobs");
      return;
    }
    
    setApplyingJob(jobId);
    setApplyStatus({ message: "", type: "" });
    
    try {
      const response = await fetch("http://localhost:8000/job-applications/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidate_email: userData.email,
          job_id: jobId,
          interviewer_email: interviewerEmail
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to apply for job");
      }
      
      // Application successful
      setApplyStatus({ 
        message: "Application submitted successfully!", 
        type: "success" 
      });
      
      // Update applied jobs list
      setAppliedJobs(prev => ({
        ...prev,
        [jobId]: "Applied"
      }));
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setApplyStatus({ message: "", type: "" });
        setApplyingJob(null);
      }, 3000);
      
    } catch (error) {
      console.error("Error applying for job:", error);
      setApplyStatus({ 
        message: error.message || "Failed to apply for job", 
        type: "error" 
      });
    }
  };
  
  // Handle save job functionality
  const handleSaveJob = async (jobId) => {
    if (!userData || userData.role !== "Candidate") {
      alert("Please login as a candidate to save jobs");
      return;
    }
    
    setSavingJob(jobId);
    setSaveStatus({ message: "", type: "" });
    
    try {
      const jobIsSaved = isJobSaved(jobId);
      
      if (jobIsSaved) {
        // Unsave the job
        const response = await fetch(
          `http://localhost:8000/saved-jobs/${userData.email}/${jobId}`, 
          { method: "DELETE" }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to unsave job");
        }
        
        setSaveStatus({ 
          message: "Job removed from saved jobs", 
          type: "success" 
        });
        
        // Update saved jobs
        setSavedJobs(currentSavedJobs => 
          currentSavedJobs.filter(job => job.id !== jobId)
        );
      } else {
        // Save the job
        const formData = new FormData();
        formData.append("candidate_email", userData.email);
        formData.append("job_id", jobId);
        
        const response = await fetch("http://localhost:8000/saved-jobs", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to save job");
        }
        
        setSaveStatus({ 
          message: "Job saved successfully!", 
          type: "success" 
        });
        
        // Update saved jobs by fetching them again
        fetchSavedJobs(userData.email);
      }
      
      // Clear status after 2 seconds
      setTimeout(() => {
        setSaveStatus({ message: "", type: "" });
        setSavingJob(null);
      }, 2000);
      
    } catch (error) {
      console.error("Error saving/unsaving job:", error);
      setSaveStatus({ 
        message: error.message || "Failed to update job save status", 
        type: "error" 
      });
    }
  };

  // Toggle between all jobs and saved jobs
  const toggleSavedJobs = () => {
    setShowSavedOnly(!showSavedOnly);
    
    // Update URL without reloading the page
    const url = new URL(window.location);
    if (!showSavedOnly) {
      url.searchParams.set('saved', 'true');
    } else {
      url.searchParams.delete('saved');
    }
    window.history.pushState({}, '', url);
  };

  return (
    <div className="browse-jobs">
      <div className="jobs-header">
        <h1>{showSavedOnly ? "Saved Jobs" : "Browse Available Jobs"}</h1>
        <p>{showSavedOnly 
          ? "View and manage your saved job listings" 
          : "Find your next opportunity from our curated list of positions"}
        </p>
      </div>

      <div className="search-filters">
        <div className="search-bar">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search jobs by title, company, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Contract">Contract</option>
            <option value="Part-time">Part-time</option>
          </select>
          
          <button 
            className={`view-toggle-btn ${showSavedOnly ? 'active' : ''}`}
            onClick={toggleSavedJobs}
          >
            {showSavedOnly ? "View All Jobs" : "View Saved Jobs"}
          </button>
        </div>
      </div>

      <div className="jobs-count">
        {loading ? (
          <p>Loading jobs...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <p>{filteredJobs.length} jobs found</p>
        )}
      </div>

      {loading ? (
        <div className="loading-indicator">Loading jobs...</div>
      ) : error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      ) : (
        <div className="jobs-grid">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-card-header">
                  <h2>{job.title}</h2>
                  <span className="company-name">{job.company}</span>
                </div>

                <div className="job-details">
                  <div className="detail-item">
                    <MapPin size={16} />
                    <span>{job.location}</span>
                  </div>
                  <div className="detail-item">
                    <Briefcase size={16} />
                    <span>{job.type}</span>
                  </div>
                  <div className="detail-item">
                    <DollarSign size={16} />
                    <span>{job.salary}</span>
                  </div>
                  <div className="detail-item">
                    <Clock size={16} />
                    <span>{formatPostedDate(job.created_at)}</span>
                  </div>
                </div>

                <p className="job-description">{job.description}</p>

                <div className="skills-list">
                  {getSkillsArray(job.skills).map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="job-card-footer">
                  {applyingJob === job.id && applyStatus.message && (
                    <div className={`alert ${applyStatus.type === "success" ? "alert-success" : "alert-danger"}`}>
                      {applyStatus.message}
                    </div>
                  )}
                  
                  {savingJob === job.id && saveStatus.message && (
                    <div className={`alert ${saveStatus.type === "success" ? "alert-success" : "alert-danger"}`}>
                      {saveStatus.message}
                    </div>
                  )}
                  
                  {appliedJobs[job.id] ? (
                    <button className="applied-btn" disabled>
                      {appliedJobs[job.id]}
                    </button>
                  ) : (
                    <button 
                      className="apply-btn"
                      onClick={() => handleApplyJob(job.id, job.interviewer_email)}
                      disabled={applyingJob === job.id || showSavedOnly}
                    >
                      {applyingJob === job.id ? "Applying..." : "Apply Now"}
                    </button>
                  )}
                  
                  <button 
                    className={`save-btn ${isJobSaved(job.id) ? 'saved' : ''}`}
                    onClick={() => handleSaveJob(job.id)}
                    disabled={savingJob === job.id}
                  >
                    {isJobSaved(job.id) ? '★ Saved' : '☆ Save Job'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-jobs-message">
              <p>
                {showSavedOnly 
                  ? "You haven't saved any jobs yet. Browse jobs and save the ones you're interested in."
                  : "No jobs found matching your criteria. Try adjusting your search or filters."}
              </p>
              {showSavedOnly && (
                <button className="browse-all-btn" onClick={toggleSavedJobs}>
                  Browse All Jobs
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BrowseJobs;