import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "./LandingPage.css";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <div className="hero">
        <div className="hero-content" data-aos="fade-up">
          <h1>Welcome to SwiftHire</h1>
          <p>Streamline your hiring process with ease.</p>
          <button
            className="cta-button"
            onClick={() => navigate("/register")}
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <h2 data-aos="fade-up">Why Choose SwiftHire?</h2>
        <div className="features" data-aos="fade-up">
          <div className="feature-box">
            <h3>Quick Hiring</h3>
            <p>Reduce hiring time with streamlined processes and expert evaluations.</p>
          </div>
          <div className="feature-box">
            <h3>Expert Interviews</h3>
            <p>Leverage a global network of expert interviewers in various fields.</p>
          </div>
          <div className="feature-box">
            <h3>Fair Assessments</h3>
            <p>Ensure unbiased evaluations with masked identities and objective scoring.</p>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="testimonials-section">
        <h2 data-aos="fade-up">What Our Users Say</h2>
        <div className="testimonials" data-aos="fade-up">
          <div className="testimonial">
            <p>"SwiftHire revolutionized our hiring process. It's fast and reliable!"</p>
            <h4>- John Doe, HR Manager</h4>
          </div>
          <div className="testimonial">
            <p>"Finding top candidates has never been this easy. Highly recommend!"</p>
            <h4>- Sarah Lee, CEO</h4>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="cta-section">
        <h2>Ready to Simplify Your Hiring Process?</h2>
        <p>Join SwiftHire today and transform the way you hire.</p>
        <button className="cta-button">Sign Up Now</button>
      </div>
    </div>
  );
};

export default LandingPage;
