import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import AOS from "aos";
import "aos/dist/aos.css";
import "./CandidateFiltering.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react"; // Choose an icon

// Define skill keywords for each profile category
const profileSkills = {
  "Frontend": ["react", "vue", "angular", "javascript", "html", "css", "bootstrap", "tailwind", "jquery", "typescript"],
  "Backend": ["node", "express", "python", "django", "flask", "php", "laravel", "java", "spring", "ruby", "rails"],
  "Full Stack": ["mern", "mean", "javascript", "typescript", "react", "node", "express", "mongodb", "python", "django"],
  "Android": ["kotlin", "java", "android studio", "xml", "firebase", "jetpack", "room", "rxjava", "mvvm"],
  "Data Science": ["python", "r", "pandas", "numpy", "matplotlib", "scikit-learn", "jupyter", "statistics"],
  "ML/AI": ["tensorflow", "pytorch", "keras", "machine learning", "deep learning", "nlp", "computer vision"],
  "Flutter": ["dart", "flutter", "mobile development", "cross-platform", "widgets", "bloc", "provider"],
  "React Native": ["react native", "javascript", "typescript", "mobile", "cross-platform", "redux"],
  "Data Engineering": ["etl", "spark", "hadoop", "sql", "nosql", "data warehouse", "kafka", "airflow"],
  "iOS": ["swift", "objective-c", "xcode", "uikit", "swiftui", "core data", "cocoa"],
  "Scrum Master": ["agile", "scrum", "kanban", "jira", "confluence", "sprint planning", "retrospectives"],
  "Project Manager": ["pmp", "agile", "waterfall", "project planning", "risk management", "leadership"]
};

const profiles = [
  { name: "Frontend", icon: "frontend.png" },
  { name: "Backend", icon: "backend.png" },
  { name: "Full Stack", icon: "fullstack.png" },
  { name: "Android", icon: "android.png" },
  { name: "Data Science", icon: "datascience.png" },
  { name: "ML/AI", icon: "ml.png" },
  { name: "Flutter", icon: "flutter.png" },
  { name: "React Native", icon: "react.png" },
  { name: "Data Engineering", icon: "dataengineering.png" },
  { name: "iOS", icon: "ios.png" },
  { name: "Scrum Master", icon: "scrum.png" },
  { name: "Project Manager", icon: "project.png" },
  // Add more profiles as needed
];

const CandidateFiltering = () => {
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setUserData] = useState(null);
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState({ id: null, message: "", type: "" });
  const navigate = useNavigate();
  const applicationsPerPage = 10;

  useEffect(() => {
    AOS.init({ duration: 1000 });

    // Get user data from localStorage
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);

      // Check if user is an interviewer
      if (parsedUserData.role === "Interviewer") {
        // If authorized, fetch applications for this interviewer
        fetchApplications(parsedUserData.email);
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

  // Fetch applications for this interviewer
  const fetchApplications = async (interviewerEmail) => {
    try {
      const response = await axios.get(`http://localhost:8000/job-applications/interviewer/${interviewerEmail}`);
      setApplications(response.data);
      setFilteredApplications(response.data);
      setTotalPages(Math.ceil(response.data.length / applicationsPerPage));
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format image URL to prevent 404
  const formatImageUrl = (imageUrl) => {
    if (!imageUrl) return DEFAULT_IMAGE; // Return default image if no URL is provided    
    if (imageUrl.startsWith('/')) {
      return `http://localhost:8000${imageUrl}`;
    } else if (imageUrl.startsWith('http')) {
      return imageUrl;
    } else {
      return `http://localhost:8000/${imageUrl}`;
    }
  };

  // Handle profile selection
  const handleSelectProfile = (name) => {
    const newSelectedProfiles = selectedProfiles.includes(name)
      ? selectedProfiles.filter((profile) => profile !== name)
      : [...selectedProfiles, name];

    setSelectedProfiles(newSelectedProfiles);
    filterApplications(newSelectedProfiles, searchQuery);
    setCurrentPage(1); // Reset to first page when selection changes
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedProfiles([]);
    setSearchQuery("");
    setFilteredApplications(applications);
    setTotalPages(Math.ceil(applications.length / applicationsPerPage));
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    filterApplications(selectedProfiles, query);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Filter applications based on skills and search query
  const filterApplications = (selectedSkills, query = searchQuery) => {
    let filtered = [...applications];

    // Filter by selected skills if any
    if (selectedSkills.length > 0) {
      filtered = filtered.filter((application) => {
        const candidateSkillsLower = application.skills?.toLowerCase() || "";

        return selectedSkills.some((profileName) => {
          // Check if candidate skills directly contain the profile name
          if (candidateSkillsLower.includes(profileName.toLowerCase())) {
            return true;
          }

          // Check if candidate skills contain any related keywords for this profile
          const relatedKeywords = profileSkills[profileName] || [];
          return relatedKeywords.some(keyword =>
            candidateSkillsLower.includes(keyword.toLowerCase())
          );
        });
      });
    }

    // Filter by search query if any
    if (query) {
      filtered = filtered.filter((application) => {
        // Special handling for name field to allow partial name matching
        if (application.candidate_name?.toLowerCase().includes(query.toLowerCase())) {
          return true;
        }
          

        // Check job title
        if (application.job_title?.toLowerCase().includes(query)) {
          return true;
        }

        // Check skills
        if (application.skills?.toLowerCase().includes(query)) {
          return true;
        }

        // Check education
        if (application.education?.toLowerCase().includes(query)) {
          return true;
        }

        // Check company
        if (application.company?.toLowerCase().includes(query)) {
          return true;
        }

        return false;
      });
    }

    setFilteredApplications(filtered);
    setTotalPages(Math.ceil(filtered.length / applicationsPerPage));
  };

  // Handle CV view
  const handleViewCV = (resumeUrl) => {
    if (resumeUrl) {
      // Format URL properly to prevent 404
      const formattedUrl = resumeUrl.startsWith('/')
        ? `http://localhost:8000${resumeUrl}`
        : resumeUrl.startsWith('http')
          ? resumeUrl
          : `http://localhost:8000/${resumeUrl}`;

      window.open(formattedUrl, '_blank');
    }
  };

  // Handle shortlisting a candidate
  const handleShortlist = async (applicationId) => {
    try {
      setUpdateStatus({ id: applicationId, message: "Processing...", type: "info" });

      const response = await axios.patch(`http://localhost:8000/job-applications/${applicationId}`, {
        status: "Shortlisted"
      });

      if (response.status === 200) {
        // Update local state
        const updatedApplications = applications.map(app =>
          app.application_id === applicationId ? { ...app, status: "Shortlisted" } : app
        );

        setApplications(updatedApplications);
        setFilteredApplications(
          filteredApplications.map(app =>
            app.application_id === applicationId ? { ...app, status: "Shortlisted" } : app
          )
        );

        setUpdateStatus({ id: applicationId, message: "Candidate shortlisted successfully!", type: "success" });

        // Clear message after 3 seconds
        setTimeout(() => {
          setUpdateStatus({ id: null, message: "", type: "" });
        }, 2000);
      }
    } catch (error) {
      console.error("Error shortlisting candidate:", error);
      setUpdateStatus({ id: applicationId, message: "Failed to shortlist candidate", type: "error" });

      // Clear error message after 3 seconds
      setTimeout(() => {
        setUpdateStatus({ id: null, message: "", type: "" });
      }, 2000);
    }
  };

  // Handle rejecting a candidate
  const handleReject = async (applicationId) => {
    try {
      setUpdateStatus({ id: applicationId, message: "Processing...", type: "info" });

      const response = await axios.patch(`http://localhost:8000/job-applications/${applicationId}`, {
        status: "Rejected"
      });

      if (response.status === 200) {
        // Update local state
        const updatedApplications = applications.map(app =>
          app.application_id === applicationId ? { ...app, status: "Rejected" } : app
        );

        setApplications(updatedApplications);
        setFilteredApplications(
          filteredApplications.map(app =>
            app.application_id === applicationId ? { ...app, status: "Rejected" } : app
          )
        );

        setUpdateStatus({ id: applicationId, message: "Candidate rejected", type: "success" });

        // Clear message after 3 seconds
        setTimeout(() => {
          setUpdateStatus({ id: null, message: "", type: "" });
        }, 2000);
      }
    } catch (error) {
      console.error("Error rejecting candidate:", error);
      setUpdateStatus({ id: applicationId, message: "Failed to reject candidate", type: "error" });

      // Clear error message after 3 seconds
      setTimeout(() => {
        setUpdateStatus({ id: null, message: "", type: "" });
      }, 2000);
    }
  };

  // Calculate current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * applicationsPerPage;
    const endIndex = startIndex + applicationsPerPage;
    return filteredApplications.slice(startIndex, endIndex);
  };

  // Pagination controls
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Default image path for missing profile images
  const DEFAULT_IMAGE = "/images/user.jpg";

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
    <div className="filter-page">
      <div className="container mt-5">
        <h2 className="text-center mb-4" data-aos="fade-down">
          Filter Applicants
        </h2>

        {/* Search Bar */}
        <div className="search-bar mb-4" data-aos="fade-up">
          <input
            type="text"
            className="form-control"
            placeholder="Search applicants by name, job title, skills, education..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {/* Profiles/Skills Grid and Clear Filters Button */}
        <div className="filters-section" data-aos="fade-up">
          <div className="filters-header">
            <h4>Filter by Skills</h4>
            {(selectedProfiles.length > 0 || searchQuery) && (
              <button
                className="btn btn-outline-light clear-filters-btn"
                onClick={clearAllFilters}
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Selected Filters Tags */}
          {selectedProfiles.length > 0 && (
            <div className="selected-filters-tags">
              {selectedProfiles.map(profile => (
                <span key={profile} className="selected-filter-tag">
                  {profile}
                  <button
                    onClick={() => handleSelectProfile(profile)}
                    className="remove-filter-btn"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Profiles/Skills Grid */}
          <div className="profiles-grid">
            {profiles.map((profile) => (
              <div
                key={profile.name}
                className={`profile-card ${selectedProfiles.includes(profile.name) ? "selected" : ""
                  }`}
                onClick={() => handleSelectProfile(profile.name)}
              >
                <img
                  src={require(`./icons/${profile.icon}`)}
                  alt={profile.name}
                  className="profile-icon"
                />
                <p>{profile.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Applications Table */}
        <div className="candidates-table mt-5">
          <h3 className="text-center" data-aos="fade-up">
            Applications - {filteredApplications.length}
          </h3>
          {loading ? (
            <p className="text-center">Loading applications...</p>
          ) : (
            <>
              <div className="table-responsive mt-4" data-aos="fade-up">
                <table className="table table-bordered table-hover">
                  <thead className="thead-dark">
                    <tr>
                      <th>Profile</th>
                      <th>Candidate Name</th>
                      <th>Job Title</th>
                      <th>Company</th>
                      <th>Education</th>
                      <th>Experience</th>
                      <th>Resume</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentPageData().map((application) => (
                      <tr key={application.application_id}>
                        <td>
                          <img
                            src={formatImageUrl(application.profile_image) || DEFAULT_IMAGE}
                            alt={application.candidate_name}
                            className="profile-img"
                            style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }}
                            onError={(e) => { e.target.src = DEFAULT_IMAGE }}
                          />
                        </td>
                        <td>{application.candidate_name}</td>
                        <td>{application.job_title}</td>
                        <td>{application.company}</td>
                        <td>{application.education || "Not Specified"}</td>
                        <td>{application.years_of_experience || 0} years</td>
                        {/* <td>{application.skills}</td> */}
                        <td>
                          <button
                            onClick={() => handleViewCV(application.resume)}
                            disabled={!application.resume}
                            className="text-gray-500 hover:text-blue-600 disabled:opacity-50"
                            title="View CV"
                          >
                            <FileText size={30} />
                          </button>
                        </td>
                        <td>
                          <span className={`status-badge status-${application.status.toLowerCase()}`}>
                            {application.status}
                          </span>
                        </td>
                        <td className="action-buttons">
                          {updateStatus.id === application.application_id && updateStatus.message && (
                            <div className={`alert alert-${updateStatus.type} p-1 mb-2`} style={{ fontSize: "12px" }}>
                              {updateStatus.message}
                            </div>
                          )}

                          <div className="d-flex flex-wrap gap-1">
                            {application.status === "Applied" && (
                              <>
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleShortlist(application.application_id)}
                                >
                                  Shortlist
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleReject(application.application_id)}
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {application.status === "Shortlisted" && (
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleReject(application.application_id)}
                              >
                                Reject
                              </button>
                            )}

                            {application.status === "Rejected" && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleShortlist(application.application_id)}
                              >
                                Shortlist
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination-container text-center mt-4">
                <nav>
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>

                    {getPageNumbers().map(number => (
                      <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(number)}
                        >
                          {number}
                        </button>
                      </li>
                    ))}

                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateFiltering;