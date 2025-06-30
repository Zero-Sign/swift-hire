import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

// This component provides role-based route protection
const ProtectedRoute = ({ children, requiredRole }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const checkUserData = () => {
      const storedUserData = localStorage.getItem("userData");
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      } else {
        setUserData(null);
      }
      setLoading(false);
    };

    checkUserData();
    
    // Set up event listener for storage changes
    window.addEventListener('storage', checkUserData);
    window.addEventListener('authChange', checkUserData);
    
    return () => {
      window.removeEventListener('storage', checkUserData);
      window.removeEventListener('authChange', checkUserData);
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // If no user data exists, redirect to registration
  if (!userData) {
    // Pass the current location and required role to the registration page
    return (
      <Navigate 
        to="/register" 
        state={{ 
          from: location.pathname,
          openModal: requiredRole 
        }} 
        replace 
      />
    );
  }

  // If the user doesn't have the required role, redirect to their dashboard
  if (requiredRole && userData.role !== requiredRole) {
    if (userData.role === "Candidate") {
      return <Navigate to="/candidate-dashboard" replace />;
    } else if (userData.role === "Interviewer") {
      return <Navigate to="/jobspost" replace />;
    }
  }

  // If the user has the required role, render the component
  return children;
};

export default ProtectedRoute;