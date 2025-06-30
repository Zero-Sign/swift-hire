import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import AdminPanel from "./pages/AdminPanel";
import Registration from "./pages/Registration";
import CandidateFiltering from "./pages/CandidateFiltering";
import Feedback from "./pages/Feedback";
import ConductInterview from "./pages/ConductInterview";
import CandidateDashboard from "./pages/CandidateDashboard";
import PostJob from "./pages/PostJobs";
import ProtectedRoute from "./pages/ProtectedRoute";
import BrowseJobs from "./pages/BrowseJobs";
import ApplicationsPage from "./pages/ApplicationsPage";
import InterviewPage from "./pages/InterviewPage";

const App = () => {
  const location = useLocation();
  const applicationId = location.state?.applicationId;

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/conduct-interview" element={<ConductInterview />} />
        <Route
          path="/interview"
          element={
            applicationId ? (
              <InterviewPage
                applicationId={applicationId}
                onBack={() => window.history.back()}
              />
            ) : (
              <div>Please select a candidate to interview</div>
            )
          }
        />
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/filter" element={<CandidateFiltering />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route
          path="/jobspost"
          element={
            <ProtectedRoute requiredRole="Interviewer">
              <PostJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate-dashboard"
          element={
            <ProtectedRoute requiredRole="Candidate">
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/browse-jobs"
          element={
            <ProtectedRoute requiredRole="Candidate">
              <BrowseJobs />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;