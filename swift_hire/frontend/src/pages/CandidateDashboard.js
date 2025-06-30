import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./CandidateDashboard.css";

function CandidateDashboard() {
  const [candidateData, setCandidateData] = useState({
    name: "",
    email: "",
    skills: [],
    bio: "",
    resume: "",
    profile_image: "/images/user.jpg",
    education: "Not Specified",
    years_of_experience: 0,
    stats: {
      profileCompletion: 0,
      applicationsSubmitted: 0,
      interviewsScheduled: 0,
      savedJobs: 0
    },
    recentActivity: [],
    recommendedJobs: []
  });
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPublicProfileModal, setShowPublicProfileModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    skills: "",
    bio: "",
    education: "Not Specified",
    years_of_experience: 0,
    resume: null,
    profile_image: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [imagePreview, setImagePreview] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState({});
  const [applyingJob, setApplyingJob] = useState(null);
  const [applyStatus, setApplyStatus] = useState({ message: "", type: "" });
  
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (userData && userData.email) {
      fetchCandidateData(userData.email);
      fetchRecommendedJobs(userData.email);
      fetchSavedJobs(userData.email);
      fetchSavedJobCount(userData.email);
      fetchApplicationAndInterviewCount(userData.email);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchApplicationAndInterviewCount = async (email) => {
    try {
      const response = await fetch(`http://localhost:8000/job-applications/candidate/${email}`);
      if (!response.ok) {
        throw new Error("Failed to fetch application data");
      }
      
      const applications = await response.json();
      const applicationCount = applications.length;
      const interviewCount = applications.filter(app => 
        app.interview_form_url && app.status === "Shortlisted"
      ).length;
      
      setCandidateData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          applicationsSubmitted: applicationCount,
          interviewsScheduled: interviewCount
        }
      }));
    } catch (error) {
      console.error("Error fetching application and interview count:", error);
    }
  };
  
  const fetchCandidateData = async (email) => {
    try {
      const response = await fetch(`http://localhost:8000/candidates/${email}`);
      if (!response.ok) {
        throw new Error("Failed to fetch candidate data");  
      }
      
      const data = await response.json();
      if ((data.role || "").toLowerCase() !== "candidate") {
        window.location.href = "/register";
        return;
      }
            
      let completionFields = 0;
      let totalFields = 7;
      if (data.name) completionFields++;
      if (data.email) completionFields++;
      if (data.skills) completionFields++;
      if (data.bio) completionFields++;
      if (data.profile_image && data.profile_image !== "/images/user.jpg") completionFields++;
      if (data.education && data.education !== "Not Specified") completionFields++;
      if (data.years_of_experience > 0) completionFields++;
      
      const profileCompletion = Math.floor((completionFields / totalFields) * 100);
      
      const skillsArray = data.skills ? data.skills.split(',').map(skill => ({
        name: skill.trim(),
        level: Math.floor(Math.random() * 30) + 70
      })) : [];
      
      setCandidateData({
        ...data,
        stats: {
          profileCompletion,
          applicationsSubmitted: 0,
          interviewsScheduled: 0,
          savedJobs: 0
        },
        recentActivity: [],
        recommendedJobs: [],
        skills: skillsArray
      });
      
      setFormData({
        name: data.name,
        skills: Array.isArray(data.skills) ? data.skills.join(", ") : data.skills || "",
        bio: data.bio || "",
        education: data.education || "Not Specified",
        years_of_experience: data.years_of_experience || 0,
        resume: null,
        profile_image: null
      });
      
      if (data.profile_image) {
        setImagePreview(data.profile_image.startsWith("uploads/") 
          ? `http://localhost:8000/${data.profile_image}` 
          : data.profile_image);
      }
    } catch (error) {
      console.error("Error fetching candidate data:", error);
    }
  };
  
  const fetchRecommendedJobs = async (email) => {
    try {
      const response = await fetch(`http://localhost:8000/candidates/${email}/recommended-jobs`);
      if (!response.ok) {
        throw new Error("Failed to fetch recommended jobs");
      }
      
      const jobs = await response.json();
      
      const appliedResponse = await fetch(`http://localhost:8000/job-applications/candidate/${email}`);
      if (!appliedResponse.ok) {
        throw new Error("Failed to fetch applied jobs");
      }
      
      const appliedJobs = await appliedResponse.json();
      const appliedJobIds = appliedJobs.map(job => job.job_id);
      
      const filteredJobs = jobs.filter(job => !appliedJobIds.includes(job.id));
      
      setCandidateData(prev => ({
        ...prev,
        recommendedJobs: filteredJobs.map(job => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          interviewer_email: job.interviewer_email
        }))
      }));
      
      fetchApplicationStatus(email, jobs.map(job => job.id));
    } catch (error) {
      console.error("Error fetching recommended jobs:", error);
    }
  };
  
  const fetchApplicationStatus = async (email, jobIds) => {
    try {
      const response = await fetch(`http://localhost:8000/job-applications/candidate/${email}`);
      if (!response.ok) {
        throw new Error("Failed to fetch application status");
      }
      
      const applications = await response.json();
      
      const jobStatusMap = {};
      applications.forEach(app => {
        jobStatusMap[app.job_id] = app.status;
      });
      
      setAppliedJobs(jobStatusMap);
    } catch (error) {
      console.error("Error fetching application status:", error);
    }
  };
  
  const handleApplyJob = async (jobId, interviewerEmail) => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData || !userData.email) {
      alert("Please login to apply for jobs");
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
      
      setApplyStatus({ 
        message: "Application submitted successfully!", 
        type: "success" 
      });
      
      setAppliedJobs(prev => ({
        ...prev,
        [jobId]: "Applied"
      }));
      
      fetchApplicationAndInterviewCount(userData.email);
      
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
  
  const fetchSavedJobs = async (email) => {
    try {
      const response = await fetch(`http://localhost:8000/saved-jobs/${email}`);
      if (!response.ok) {
        throw new Error("Failed to fetch saved jobs");
      }
      
      const jobs = await response.json();
      setSavedJobs(jobs);
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
    }
  };
  
  const fetchSavedJobCount = async (email) => {
    try {
      const response = await fetch(`http://localhost:8000/saved-jobs/count/${email}`);
      if (!response.ok) {
        throw new Error("Failed to fetch saved job count");
      }
      
      const data = await response.json();
      setCandidateData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          savedJobs: data.count
        }
      }));
    } catch (error) {
      console.error("Error fetching saved job count:", error);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === "profile_image" && files.length > 0) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(files[0]);
    }
    
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setIsSubmitting(true);
    
    try {
      const userData = JSON.parse(localStorage.getItem("userData"));
      if (!userData || !userData.email) {
        throw new Error("User data not found");
      }
      
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("skills", formData.skills);
      formDataToSend.append("bio", formData.bio || "");
      formDataToSend.append("education", formData.education);
      formDataToSend.append("years_of_experience", formData.years_of_experience.toString());
          
      if (formData.resume) {
        formDataToSend.append("resume", formData.resume);
      }
      
      if (formData.profile_image) {
        formDataToSend.append("profile_image", formData.profile_image);
      }

      const response = await fetch(`http://localhost:8000/candidates/${userData.email}`, {
        method: "PUT",
        body: formDataToSend,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update profile");
      }
      
      await response.json();
      
      userData.name = formData.name;
      localStorage.setItem("userData", JSON.stringify(userData));
      
      fetchCandidateData(userData.email);
      fetchRecommendedJobs(userData.email);
      setMessage({ text: "Profile updated successfully!", type: "success" });
      
      setTimeout(() => {
        setShowProfileModal(false);
        setShowResumeModal(false);
        setMessage({ text: "", type: "" });
      }, 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ text: error.message || "Failed to update profile", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSaveJob = async (jobId) => {
    try {
      const userData = JSON.parse(localStorage.getItem("userData"));
      if (!userData || !userData.email) {
        throw new Error("User data not found");
      }
      
      const jobIsSaved = isJobSaved(jobId);
      
      if (jobIsSaved) {
        const response = await fetch(
          `http://localhost:8000/saved-jobs/${userData.email}/${jobId}`, 
          { method: "DELETE" }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to unsave job");
        }
        
        fetchSavedJobCount(userData.email);
        fetchSavedJobs(userData.email);        
      } else {
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
        
        fetchSavedJobCount(userData.email);
        fetchSavedJobs(userData.email);        
      }
    } catch (error) {
      console.error("Error saving/unsaving job:", error);
      alert(error.message || "Failed to update job save status");
    }
  };
  
  const isJobSaved = (jobId) => {
    return savedJobs.some(job => job.id === jobId);
  };
  
  const handleResumeUpdate = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setIsSubmitting(true);
    
    try {
      const userData = JSON.parse(localStorage.getItem("userData"));
      if (!userData || !userData.email) {
        throw new Error("User data not found");
      }
      
      if (!formData.resume) {
        throw new Error("Please select a resume file");
      }
      
      const formDataToSend = new FormData();
      formDataToSend.append("name", candidateData.name);
      formDataToSend.append("skills", candidateData.skills);
      formDataToSend.append("bio", candidateData.bio || "");
      formDataToSend.append("resume", formData.resume);
      
      const response = await fetch(`http://localhost:8000/candidates/${userData.email}`, {
        method: "PUT",
        body: formDataToSend,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update resume");
      }
      
      fetchCandidateData(userData.email);
      setMessage({ text: "Resume updated successfully!", type: "success" });
      
      setTimeout(() => {
        setShowResumeModal(false);
        setMessage({ text: "", type: "" });
      }, 2000);
    } catch (error) {
      console.error("Error updating resume:", error);
      setMessage({ text: error.message || "Failed to update resume", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="profile-overview">
          <div className="profile-image-container">
            <img 
              src={
                candidateData.profile_image.startsWith("uploads/") 
                  ? `http://localhost:8000/${candidateData.profile_image}` 
                  : candidateData.profile_image
              } 
              alt="Profile" 
              className="profile-image" 
              style={{ 
                width: '120px', 
                height: '120px', 
                objectFit: 'cover', 
                borderRadius: '50%' 
              }} 
            />
          </div>
          <div className="profile-info">
            <h1>Welcome back, {candidateData.name || "Candidate"}!</h1>
            <p>Let's continue your job search journey</p>
            {candidateData.bio && <p className="candidate-bio">{candidateData.bio}</p>}
          </div>
        </div>
        <div className="action-buttons">
          <button className="primary-btn" onClick={() => setShowProfileModal(true)}>Update Profile</button>
          <button className="secondary-btn" onClick={() => setShowPublicProfileModal(true)}>View Public Profile</button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <h3>Profile Completion</h3>
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${candidateData.stats.profileCompletion}%` }}
              >
                <span className="progress-text">{candidateData.stats.profileCompletion}%</span>
              </div>
            </div>
            <p className="stat-description">Complete your profile to attract more recruiters</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <h3>Applications</h3>
            <div className="stat-number">{candidateData.stats.applicationsSubmitted}</div>
            <p className="stat-description">Jobs applied this month</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>Interviews</h3>
            <div className="stat-number">{candidateData.stats.interviewsScheduled}</div>
            <p className="stat-description">Upcoming interviews</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>Saved Jobs</h3>
            <div className="stat-number">{candidateData.stats.savedJobs}</div>
            <p className="stat-description">Jobs in your wishlist</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-left">
          <section className="dashboard-section">
            <h2>Recent Activity</h2>
            {candidateData.recentActivity && candidateData.recentActivity.length > 0 ? (
              <div className="activity-list">
                {candidateData.recentActivity.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <div className={`activity-icon ${activity.type}`}></div>
                    <div className="activity-details">
                      <h4>{activity.company}</h4>
                      {activity.role && <p>{activity.role}</p>}
                      <span className="activity-date">{activity.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No recent activity to display</p>
            )}
          </section>

          <section className="dashboard-section">
            <h2>Skills Overview</h2>
            {candidateData.skills && candidateData.skills.length > 0 ? (
              <div className="skills-grid">
                {candidateData.skills.map(skill => (
                  <div key={skill.name} className="skill-card">
                    <div className="skill-header">
                      <h4>{skill.name}</h4>
                      <span>{skill.level}%</span>
                    </div>
                    <div className="skill-progress">
                      <div 
                        className="skill-progress-bar" 
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No skills listed. Update your profile to add skills.</p>
            )}
          </section>
        </div>

        <div className="content-right">
          <section className="dashboard-section">
            <h2>Recommended Jobs</h2>
            {candidateData.recommendedJobs && candidateData.recommendedJobs.length > 0 ? (
              <div className="job-recommendations">
                {candidateData.recommendedJobs.map(job => (
                  <div key={job.id} className="job-card">
                    <h3 className="job-title">{job.title}</h3>
                    <p className="company">{job.company}</p>
                    <div className="job-meta">
                      <span className="location">{job.location}</span>
                      <span className="salary">{job.salary}</span>
                    </div>
                    <div className="job-actions">
                      {applyingJob === job.id && applyStatus.message && (
                        <div className={`alert ${applyStatus.type === "success" ? "alert-success" : "alert-danger"}`}>
                          {applyStatus.message}
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
                          disabled={applyingJob === job.id}
                        >
                          {applyingJob === job.id ? "Applying..." : "Quick Apply"}
                        </button>
                      )}
                      <div
                        className={`save-icon ${isJobSaved(job.id) ? 'saved' : ''}`}
                        onClick={() => handleSaveJob(job.id)}
                        title={isJobSaved(job.id) ? 'Unsave Job' : 'Save Job'}
                      >
                        {isJobSaved(job.id) ? '★' : '☆'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No matching jobs found at the moment. Check back later!</p>
            )}
          </section>

          <section className="dashboard-section">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <Link onClick={() => setShowProfileModal(true)} className="quick-action-btn">
                Edit Profile
              </Link>
              <Link to="/applications" className="quick-action-btn">
                View Applications
              </Link>
              <Link to="/browse-jobs?saved=true" className="quick-action-btn">
                View Saved Jobs
              </Link>
              <Link onClick={() => setShowResumeModal(true)} className="quick-action-btn">
                Update Resume
              </Link>
            </div>
          </section>
        </div>
      </div>

      {showProfileModal && (
        <div className="modal show d-block">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Your Profile</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowProfileModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {message.text && (
                  <div
                    className={`alert ${
                      message.type === "success" ? "alert-success" : "alert-danger"
                    }`}
                  >
                    {message.text}
                  </div>
                )}
                
                <form onSubmit={handleUpdateProfile}>
                  <div className="mb-3 text-center">
                    <img 
                      src={imagePreview || "/images/user.jpg"} 
                      alt="Profile Preview" 
                      className="profile-preview" 
                      style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%' }}
                    />
                    <div className="mt-2">
                      <input
                        type="file"
                        className="form-control"
                        id="profile_image"
                        name="profile_image"
                        accept="image/*"
                        onChange={handleChange}
                      />
                      <small className="form-text text-muted">
                        Upload a new profile picture (optional)
                      </small>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Bio</label>
                    <textarea
                      className="form-control"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell us about yourself..."
                      rows="3"
                    ></textarea>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Skills (comma separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      required
                      placeholder="React, JavaScript, Node.js"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Education</label>
                    <select
                      className="form-select"
                      name="education"
                      value={formData.education}
                      onChange={handleChange}
                    >
                      <option value="Not Specified">Not Specified</option>
                      <option value="MATRIC">MATRIC</option>
                      <option value="INTERMEDIATE">INTERMEDIATE</option>
                      <option value="Bachelor's">Bachelor's</option>
                      <option value="Master">Master</option>
                      <option value="PHD">PHD</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Years of Experience</label>
                    <input
                      type="number"
                      className="form-control"
                      name="years_of_experience"
                      value={formData.years_of_experience}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Resume (optional)</label>
                    <input
                      type="file"
                      className="form-control"
                      name="resume"
                      onChange={handleChange}
                    />
                    <small className="form-text text-muted">
                      Leave empty to keep your current resume
                    </small>
                  </div>
                  
                  <div className="text-center">
                    <button 
                      type="submit" 
                      className="btn btn-success"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Updating...' : 'Update Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPublicProfileModal && (
        <div className="modal show d-block">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Public Profile</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPublicProfileModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="public-profile">
                  <div className="text-center mb-4">
                    <img 
                      src={
                        candidateData.profile_image.startsWith("uploads/") 
                          ? `http://localhost:8000/${candidateData.profile_image}` 
                          : candidateData.profile_image
                      } 
                      alt="Profile" 
                      className="profile-image-large" 
                      style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '50%' }}
                    />
                    <h2 className="mt-3">{candidateData.name}</h2>
                    <p>{candidateData.email}</p>
                  </div>
                  
                  <div className="profile-section">
                    <h3>About Me</h3>
                    <p>{candidateData.bio || "No bio information provided yet."}</p>
                  </div>
                  <div className="profile-section">
                    <h3>Education</h3>
                    <p>{candidateData.education || "Not Specified"}</p>
                  </div>
                  
                  <div className="profile-section">
                    <h3>Years of Experience</h3>
                    <p>{candidateData.years_of_experience > 0 ? `${candidateData.years_of_experience} years` : "Not specified"}</p>
                  </div>
                  <div className="profile-section">
                    <h3>Skills</h3>
                    <div className="skills-tags">
                      {candidateData.skills && candidateData.skills.length > 0 ? (
                        candidateData.skills.map(skill => (
                          <span key={skill.name} className="skill-tag">
                            {skill.name}
                          </span>
                        ))
                      ) : (
                        <p>No skills listed</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="profile-section">
                    <h3>Resume</h3>
                    {candidateData.resume ? (
                      <div className="resume-section">
                        <p>Resume filename: {candidateData.resume.split('/').pop()}</p>
                        <a 
                          href={`http://localhost:8000/${candidateData.resume}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                        >
                          View Resume
                        </a>
                      </div>
                    ) : (
                      <p>No resume uploaded</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPublicProfileModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showResumeModal && (
        <div className="modal show d-block">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Your Resume</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowResumeModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {message.text && (
                  <div
                    className={`alert ${
                      message.type === "success" ? "alert-success" : "alert-danger"
                    }`}
                  >
                    {message.text}
                  </div>
                )}
                
                <form onSubmit={handleResumeUpdate}>
                  <div className="mb-3">
                    <label className="form-label">Current Resume</label>
                    {candidateData.resume ? (
                      <p>{candidateData.resume.split('/').pop()}</p>
                    ) : (
                      <p>No resume uploaded</p>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Upload New Resume</label>
                    <input
                      type="file"
                      className="form-control"
                      name="resume"
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="text-center">
                    <button 
                      type="submit" 
                      className="btn btn-success"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Updating...' : 'Update Resume'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidateDashboard;