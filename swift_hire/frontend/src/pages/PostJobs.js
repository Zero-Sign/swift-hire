import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Registration.css";
import AOS from "aos";
import "aos/dist/aos.css";
import { useNavigate } from "react-router-dom";

const JobBoard = () => {
  const [userData, setUserData] = useState({
    name: "",
    email: ""
  });
  
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [jobs, setJobs] = useState([]);
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();

  const [jobFormData, setJobFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "",
    salary: "",
    description: "",
    skills: ""
  });

  useEffect(() => {
    AOS.init({ duration: 1000 });
    
    // Get user data from localStorage
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);
      
      // Check if user is an interviewer
      if (parsedUserData.role === "Interviewer") {
        // If authorized, fetch jobs
        fetchJobs(parsedUserData.email);
      } else {
        // If unauthorized, show modal and redirect
        setShowUnauthorizedModal(true);
        setTimeout(() => {
          navigate("/register");
        }, 5000);
      }
    } else {
      // If no user data, show modal and redirect
      setShowUnauthorizedModal(true);
      setTimeout(() => {
        navigate("/register");
      }, 5000);
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJobFormData({
      ...jobFormData,
      [name]: value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!jobFormData.title) newErrors.title = "Job title is required";
    if (!jobFormData.company) newErrors.company = "Company name is required";
    if (!jobFormData.location) newErrors.location = "Location is required";
    if (!jobFormData.type) newErrors.type = "Job type is required";
    if (!jobFormData.salary) newErrors.salary = "Salary range is required";
    if (!jobFormData.description) newErrors.description = "Job description is required";
    if (!jobFormData.skills) newErrors.skills = "Skills are required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to fetch jobs from the API for a specific interviewer
  const fetchJobs = async (email) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/job-posts/interviewer/${email}`);
      if (!response.ok) {
        throw new Error("Failed to fetch job posts");
      }
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setServerMessage({
        text: "Failed to load job listings. Please try again later.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format the date for display
  const formatDate = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffTime = Math.abs(now - postDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMessage(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Create FormData for submission
      const formData = new FormData();
      formData.append("title", jobFormData.title);
      formData.append("company", jobFormData.company);
      formData.append("location", jobFormData.location);
      formData.append("type", jobFormData.type);
      formData.append("salary", jobFormData.salary);
      formData.append("description", jobFormData.description);
      formData.append("skills", jobFormData.skills);
      formData.append("interviewer_email", userData.email); // Add the interviewer's email

      const response = await fetch("http://localhost:8000/job-posts", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to post job");
      }

      // Job posted successfully
      setServerMessage({
        text: "Job posted successfully!",
        type: "success"
      });

      // Reset form
      setJobFormData({
        title: "",
        company: "",
        location: "",
        type: "",
        salary: "",
        description: "",
        skills: ""
      });

      // Refresh job listings for this interviewer
      fetchJobs(userData.email);

      // Close modal after a short delay
      setTimeout(() => {
        setShowModal(false);
      }, 1500);
    } catch (err) {
      console.error("Error:", err);
      setServerMessage({
        text: err.message || "An error occurred while posting the job.",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to delete a job
  const deleteJob = async (jobId) => {
    try {
      const response = await fetch(`http://localhost:8000/job-posts/${jobId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete job post");
      }

      // Show success message
      setServerMessage({
        text: "Job deleted successfully!",
        type: "success"
      });

      // Refresh job listings
      fetchJobs(userData.email);
      
      // Clear the confirmation modal
      setConfirmDelete(null);
      
      // Auto-hide the message after 3 seconds
      setTimeout(() => {
        setServerMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error deleting job:", error);
      setServerMessage({
        text: "Failed to delete job. Please try again later.",
        type: "error"
      });
    }
  };

  // If showing unauthorized modal, render only that
  if (showUnauthorizedModal) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">Unauthorized Access ⚠️</h5>
            </div>
            <div className="modal-body text-center">
              <div className="mb-4">
                <span style={{ fontSize: "50px" }}>🔒</span>
              </div>
              <h4>You are not authorized to view this page!</h4>
              <p>Please login as an Interviewer to access this feature. 👨‍💼</p>
              <p>Redirecting you to the registration page in 5 seconds... ⏱️</p>
              <div className="progress mt-3">
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated bg-info" 
                  role="progressbar" 
                  style={{ width: "100%" }}
                  aria-valuenow="100" 
                  aria-valuemin="0" 
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="text-center mb-5" data-aos="fade-down">
        <h2>Welcome, {userData.name}!</h2>
        <p className="subtitle">Manage your job postings and create new opportunities</p>
        <div className="d-flex justify-content-center mt-4">
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            Post a Job
          </button>
        </div>
      </div>

      {/* Server Messages */}
      {serverMessage && (
        <div 
          className={`alert ${serverMessage.type === "success" ? "alert-success" : "alert-danger"} d-flex justify-content-between align-items-center`}
          role="alert"
        >
          {serverMessage.text}
          <button type="button" className="btn-close" onClick={() => setServerMessage(null)}></button>
        </div>
      )}

      {/* Job Listings */}
      <div className="row mt-4" data-aos="fade-up">
        <h3 className="mb-4">Your Job Listings</h3>
        {isLoading ? (
          <div className="col-12 text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading your job listings...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="col-12 text-center">
            <p>You haven't posted any jobs yet. Click "Post a Job" to create your first listing!</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div className="col-md-6 col-lg-4 mb-4" key={job.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <h5 className="card-title mb-0">{job.title}</h5>
                    <button 
                      className="btn btn-sm btn-outline-danger" 
                      onClick={() => setConfirmDelete(job.id)}
                      title="Delete Job"
                    >
                      <i className="bi bi-trash"></i> Delete
                    </button>
                  </div>
                  <h6 className="card-subtitle mb-2 text-muted mt-1">{job.company}</h6>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="badge bg-light text-dark">{job.location}</span>
                    <span className="badge bg-info">{job.type}</span>
                  </div>
                  <p className="card-text">{job.description}</p>
                  <div className="mb-3">
                    <strong>Salary:</strong> {job.salary}
                  </div>
                  <div className="mb-3">
                    <strong>Skills:</strong>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {job.skills.split(",").map((skill, i) => (
                        <span key={i} className="badge bg-secondary">{skill.trim()}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-muted mt-2">
                    <small>Posted: {formatDate(job.created_at)}</small>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Post Job Modal */}
      {showModal && (
        <div className="modal show d-block" data-aos="fade-up">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Post a Job</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {serverMessage && (
                  <div
                    className={`alert ${
                      serverMessage.type === "success" ? "alert-success" : "alert-danger"
                    }`}
                  >
                    {serverMessage.text}
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Job Title</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      value={jobFormData.title}
                      onChange={handleChange}
                      placeholder="e.g. Frontend Developer"
                    />
                    {errors.title && <small className="text-danger">{errors.title}</small>}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Company</label>
                    <input
                      type="text"
                      className="form-control"
                      name="company"
                      value={jobFormData.company}
                      onChange={handleChange}
                      placeholder="e.g. Tech Solutions Inc"
                    />
                    {errors.company && <small className="text-danger">{errors.company}</small>}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      name="location"
                      value={jobFormData.location}
                      onChange={handleChange}
                      placeholder="e.g. New York"
                    />
                    {errors.location && <small className="text-danger">{errors.location}</small>}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Job Type</label>
                    <select
                      className="form-select"
                      name="type"
                      value={jobFormData.type}
                      onChange={handleChange}
                    >
                      <option value="">Select Job Type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">Temporary</option>
                      <option value="Internship">Internship</option>
                    </select>
                    {errors.type && <small className="text-danger">{errors.type}</small>}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Salary Range</label>
                    <input
                      type="text"
                      className="form-control"
                      name="salary"
                      value={jobFormData.salary}
                      onChange={handleChange}
                      placeholder="e.g. $80k - $100k"
                    />
                    {errors.salary && <small className="text-danger">{errors.salary}</small>}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={jobFormData.description}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Describe the job responsibilities and requirements"
                    ></textarea>
                    {errors.description && <small className="text-danger">{errors.description}</small>}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Skills (comma separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="skills"
                      value={jobFormData.skills}
                      onChange={handleChange}
                      placeholder="e.g. React, JavaScript, CSS"
                    />
                    {errors.skills && <small className="text-danger">{errors.skills}</small>}
                  </div>

                  <div className="d-grid gap-2">
                    <button 
                      type="submit" 
                      className="btn btn-success"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Posting Job...' : 'Post Job'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="modal show d-block">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setConfirmDelete(null)}
                ></button>
              </div>
              <div className="modal-body text-center">
                <div className="mb-4">
                  <span style={{ fontSize: "50px" }}>🗑️</span>
                </div>
                <h4>Are you sure?</h4>
                <p>This action cannot be undone. This will permanently delete this job posting.</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={() => deleteJob(confirmDelete)}
                >
                  Delete Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showModal || confirmDelete) && <div className="modal-backdrop show"></div>}
    </div>
  );
};

export default JobBoard;