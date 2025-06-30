import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load user data from localStorage on component mount and when location changes
  useEffect(() => {
    const checkUserData = () => {
      const storedUserData = localStorage.getItem("userData");
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      } else {
        setUserData(null);
      }
    };

    checkUserData();
    
    // Set up event listener for storage changes
    window.addEventListener('storage', checkUserData);
    
    // Custom event listener for login/logout events
    const handleAuthChange = () => checkUserData();
    window.addEventListener('authChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', checkUserData);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [location]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSignOut = () => {
    // Clear user data and redirect to registration page
    localStorage.removeItem("userData");
    setUserData(null);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('authChange'));
    
    navigate("/register");
  };

  const handleUnauthorizedAccess = (type) => {
    // Redirect to registration with specific role modal
    navigate("/register", { state: { openModal: type } });
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="logo">
          <Link to="/">SwiftHire</Link>
        </div>

        {/* Links */}
        <div className={`nav-links ${isMobileMenuOpen ? "active" : ""}`}>
          {/* Admin link is always visible */}
          <Link to="/admin">Admin Panel</Link>
          
          {/* Show Registration only if not logged in */}
          {!userData && <Link to="/register">Registration</Link>}

          {/* Logic for Candidate */}
          {userData?.role === "Candidate" ? (
            <>
              <Link to="/candidate-dashboard">Candidate Dashboard</Link>
              <Link to="/browse-jobs">Browse Jobs</Link>
            </>
          ) : !userData ? (
            <div className="nav-item">
              <span 
                className="nav-link" 
                onClick={() => handleUnauthorizedAccess("Candidate")}
              >
                Candidates
              </span>
            </div>
          ) : null}

          {/* Logic for Interviewer */}
          {userData?.role === "Interviewer" ? (
            <>
              <Link to="/filter">Filter Candidates</Link>
              <Link to="/conduct-interview">Conduct Interview</Link>
              <Link to="/jobspost">Post Jobs</Link>
            </>
          ) : !userData ? (
            <div className="nav-item">
              <span 
                className="nav-link" 
                onClick={() => handleUnauthorizedAccess("Interviewer")}
              >
                Interviewers
              </span>
            </div>
          ) : null}

          {/* Additional Links */}
          <Link to="/feedback">Feedback</Link>
          
          {/* Show user info and sign out if logged in */}
          {userData && (
            <>
              <span className="user-info">
                {userData.name || userData.email}
              </span>
              <button 
                className="sign-out-btn"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </>
          )}
        </div>

        {/* Hamburger Menu for Mobile */}
        <div className="hamburger" onClick={toggleMobileMenu}>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;