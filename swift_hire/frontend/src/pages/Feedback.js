import React, { useState, useEffect } from "react";
import "./Feedback.css";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Feedback = () => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const ratingLabels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

  // Fetch current user info from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    } else {
      // If no user is logged in, redirect to landing page with a state to open login modal
      navigate("/", { state: { openModal: "Candidate" } });
    }
  }, [navigate]);

  const handleSubmit = async () => {
    // Additional validation for login
    if (!currentUser) {
      setError("You must be logged in to submit feedback");
      navigate("/", { state: { openModal: "Candidate" } });
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("rating", rating);
      formData.append("message", feedback);
      formData.append("user_email", currentUser.email);
      formData.append("user_name", currentUser.name);
      formData.append("user_role", currentUser.role);
      
      // Send feedback to the backend using fetch
      const response = await fetch("http://localhost:8000/feedback/", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.detail || "Failed to submit feedback");
      }
      
      await response.json();
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit feedback. Please try again later.");
      console.error("Error submitting feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  // If user data is still loading, show a loading indicator
  if (currentUser === null) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <div className="container mt-5">
      <div className="card shadow-sm">
        <div className="card-body feedback-page">
          <h2 className="card-title text-center mb-4">Give Feedback</h2>

          {error && <div className="alert alert-danger">{error}</div>}

          {submitted ? (
            <div className="thank-you-message">
              <div className="alert alert-success">
                <h3>Thank you for your feedback!</h3>
                <p>Your rating: {ratingLabels[rating - 1]}</p>
                <p>Your message: {feedback}</p>
              </div>
              <div className="text-center mt-3">
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    setSubmitted(false);
                    setRating(0);
                    setFeedback("");
                  }}
                >
                  Submit Another Feedback
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-center">Hi, <strong>{currentUser.name}</strong>! Please share your experience with us.</p>
              
              {/* Star Rating */}
              <div className="stars">
                {[...Array(5)].map((_, index) => (
                  <span
                    key={index}
                    className={index < rating ? "star selected" : "star"}
                    onClick={() => setRating(index + 1)}
                  >
                    ★
                  </span>
                ))}
              </div>

              {/* Display selected rating */}
              {rating > 0 && <p className="rating-label">{ratingLabels[rating - 1]}</p>}

              {/* Feedback Textarea */}
              <div className="form-group">
                <textarea
                  className="form-control"
                  placeholder="Leave your feedback here..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  maxLength={300}
                  rows="4"
                ></textarea>
                <p className="character-counter">{feedback.length}/300 characters</p>
              </div>

              {/* Submit Button */}
              <div className="text-center mt-4">
                <button
                  className="btn btn-success"
                  onClick={handleSubmit}
                  disabled={rating === 0 || feedback.trim() === "" || loading}
                >
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feedback;