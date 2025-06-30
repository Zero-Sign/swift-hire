import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Registration.css";
import AOS from "aos";
import "aos/dist/aos.css";
import { useNavigate, useLocation } from "react-router-dom";

const Registration = () => {
  const [role, setRole] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    skills: "",
    resume: null,
    bio: "", // Added bio field for candidates
    expertise: "",
    availability: "",
    department: "",
    profile_image: null, // Added profile image field
  });
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginErrors, setLoginErrors] = useState({});
  const [serverMessage, setServerMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1000 });

    // Check if user is already logged in
    const userData = localStorage.getItem("userData");
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role === "Candidate") {
        navigate("/candidate-dashboard");
      } else if (user.role === "Interviewer") {
        navigate("/jobspost");
      }
    }

    // Check if we need to open a specific modal from navigation
    if (location.state?.openModal) {
      openModal(location.state.openModal);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData({
      ...loginData,
      [name]: value,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required.";
    if (!formData.email) newErrors.email = "Email is required.";
    if (!formData.password) newErrors.password = "Password is required.";
    if (role === "Candidate" && !formData.skills)
      newErrors.skills = "Skills are required.";
    if (role === "Candidate" && !formData.resume)
      newErrors.resume = "Resume is required.";
    if (role === "Interviewer" && !formData.expertise)
      newErrors.expertise = "Expertise is required.";
    if (role === "Interviewer" && !formData.availability)
      newErrors.availability = "Availability is required.";
    if (role === "Interviewer" && !formData.department)
      newErrors.department = "Department is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateLoginForm = () => {
    const newErrors = {};
    if (!loginData.email) newErrors.email = "Email is required.";
    if (!loginData.password) newErrors.password = "Password is required.";
    setLoginErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMessage(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Create FormData object for submission
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("password", formData.password);

    // Add role-specific fields
    if (role === "Candidate") {
      formDataToSend.append("skills", formData.skills);
      formDataToSend.append("resume", formData.resume);
      formDataToSend.append("bio", formData.bio || ""); // Add bio
      if (formData.profile_image) {
        formDataToSend.append("profile_image", formData.profile_image);
      }
    } else if (role === "Interviewer") {
      formDataToSend.append("expertise", formData.expertise);
      formDataToSend.append("availability", formData.availability);
      formDataToSend.append("department", formData.department);
    }

    try {
      // Submit to the appropriate endpoint based on role
      const endpoint = `http://localhost:8000/register/${role.toLowerCase()}`;

      const response = await fetch(endpoint, {
        method: "POST",
        body: formDataToSend,
        // No Content-Type header - browser will set it with boundary for FormData
      });

      const result = await response.json();

      if (!response.ok) {
        setServerMessage({
          text: result.detail || "Registration failed.",
          type: "error",
        });
        return;
      }

      setServerMessage({
        text: `Successfully registered as ${role}!`,
        type: "success",
      });

      // Clear form on success and show login form
      setFormData({
        name: "",
        email: "",
        password: "",
        skills: "",
        bio: "",
        resume: null,
        expertise: "",
        availability: "",
        department: "",
        profile_image: null,
      });
      setShowLoginForm(true);
    } catch (err) {
      console.error("Error:", err);
      setServerMessage({
        text: "An error occurred during registration.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setServerMessage(null);

    if (!validateLoginForm()) return;

    setIsSubmitting(true);

    // Create FormData object for login
    const formDataToSend = new FormData();
    formDataToSend.append("email", loginData.email);
    formDataToSend.append("password", loginData.password);

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        setServerMessage({
          text: result.detail || "Login failed.",
          type: "error",
        });
        return;
      }

      setServerMessage({
        text: `Successfully logged in as ${result.role}!`,
        type: "success",
      });

      // Store user data in localStorage so it can be accessed by other components
      const userData = {
        name: result.name,
        email: result.email,
        role: result.role
      };
      localStorage.setItem("userData", JSON.stringify(userData));

      // Trigger a custom event to notify components about authentication change
      window.dispatchEvent(new Event('authChange'));

      // Redirect based on role
      setTimeout(() => {
        if (result.role === "Candidate") {
          navigate("/candidate-dashboard");
        }
        else if (result.role === "Interviewer") {
          navigate("/jobspost");
        }
      }, 1000);

      // Reset login form
      setLoginData({
        email: "",
        password: "",
      });
    } catch (err) {
      console.error("Error:", err);
      setServerMessage({
        text: "An error occurred during login.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (selectedRole) => {
    setRole(selectedRole);
    setShowModal(true);
    setShowLoginForm(false);
    setFormData({
      name: "",
      email: "",
      password: "",
      skills: "",
      bio: "",
      resume: null,
      expertise: "",
      availability: "",
      department: "",
      profile_image: null,
    });
    setLoginData({
      email: "",
      password: "",
    });
    setErrors({});
    setLoginErrors({});
    setServerMessage(null);
  };

  const switchToLogin = () => {
    setShowLoginForm(true);
  };

  const switchToRegister = () => {
    setShowLoginForm(false);
  };

  return (
    <div className="registration-container">
      <div className="text-center mt-5" data-aos="fade-down">
        <h2>Welcome to Our Platform</h2>
        <p className="subtitle">Choose your role to sign up with us.</p>
        <div className="d-flex justify-content-center gap-4 mt-4">
          <button
            className="btn btn-primary"
            onClick={() => openModal("Candidate")}
          >
            Register as Candidate
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => openModal("Interviewer")}
          >
            Register as Interviewer
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block"  data-aos="fade-up">
          <div className="modal-dialog" >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {showLoginForm
                    ? `Login as ${role}`
                    : `Register as ${role}`}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {serverMessage && (
                  <div
                    className={`alert ${serverMessage.type === "success" ? "alert-success" : "alert-danger"
                      }`}
                  >
                    {serverMessage.text}
                  </div>
                )}

                {!showLoginForm ? (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                      />
                      {errors.name && <small className="text-danger">{errors.name}</small>}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                      {errors.email && <small className="text-danger">{errors.email}</small>}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                      />
                      {errors.password && <small className="text-danger">{errors.password}</small>}
                    </div>

                    {role === "Candidate" && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">Skills</label>
                          <input
                            type="text"
                            className="form-control"
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            placeholder="React, JavaScript, Node.js"
                          />
                          {errors.skills && <small className="text-danger">{errors.skills}</small>}
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Bio (optional)</label>
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
                          <label className="form-label">Resume</label>
                          <input
                            type="file"
                            className="form-control"
                            name="resume"
                            onChange={handleChange}
                          />
                          {errors.resume && <small className="text-danger">{errors.resume}</small>}
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Profile Image (optional)</label>
                          <input
                            type="file"
                            className="form-control"
                            name="profile_image"
                            accept="image/*"
                            onChange={handleChange}
                          />
                        </div>
                      </>
                    )}

                    {role === "Interviewer" && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">Expertise</label>
                          <input
                            type="text"
                            className="form-control"
                            name="expertise"
                            value={formData.expertise}
                            onChange={handleChange}
                          />
                          {errors.expertise && (
                            <small className="text-danger">{errors.expertise}</small>
                          )}
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Availability</label>
                          <input
                            type="text"
                            className="form-control"
                            name="availability"
                            value={formData.availability}
                            onChange={handleChange}
                          />
                          {errors.availability && (
                            <small className="text-danger">{errors.availability}</small>
                          )}
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Department</label>
                          <input
                            type="text"
                            className="form-control"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                          />
                          {errors.department && (
                            <small className="text-danger">{errors.department}</small>
                          )}
                        </div>
                      </>
                    )}

                    <div className="text-center">
                      <button
                        type="submit"
                        className="btn btn-success"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Registering...' : 'Register'}
                      </button>
                    </div>
                    <div className="mt-3 text-center">
                      <p>Already have an account? <button type="button" className="btn btn-link p-0" onClick={switchToLogin}>Login here</button></p>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleLoginSubmit}>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={loginData.email}
                        onChange={handleLoginChange}
                      />
                      {loginErrors.email && <small className="text-danger">{loginErrors.email}</small>}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={loginData.password}
                        onChange={handleLoginChange}
                      />
                      {loginErrors.password && <small className="text-danger">{loginErrors.password}</small>}
                    </div>
                    <div className="text-center">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Logging in...' : 'Login'}
                      </button>
                    </div>
                    <div className="mt-3 text-center">
                      <p>Don't have an account? <button type="button" className="btn btn-link p-0" onClick={switchToRegister}>Register here</button></p>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Registration;