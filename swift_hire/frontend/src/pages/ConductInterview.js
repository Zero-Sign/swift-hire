import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './ConductInterview.css';
import { gapi } from 'gapi-script';
import { useNavigate } from 'react-router-dom';

const ConductInterview = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [meetingDate, setMeetingDate] = useState(new Date());
  const [meetingDuration, setMeetingDuration] = useState(60);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDescription, setMeetingDescription] = useState("");
  const [schedulingStatus, setSchedulingStatus] = useState(null);
  const [isGapiInitialized, setIsGapiInitialized] = useState(false);

  useEffect(() => {
    const initClient = () => {
      gapi.load('client:auth2', () => {
        gapi.client
          .init({
            clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/calendar.events',
          })
          .then(() => {
            return gapi.client.load('calendar', 'v3');
          })
          .then(() => {
            setIsGapiInitialized(true);
            console.log('Google API client initialized');
          })
          .catch((error) => {
            console.error('Error initializing Google API client:', error);
            setSchedulingStatus({
              type: 'error',
              message: 'Failed to initialize Google API client. Please try again.',
            });
          });
      });
    };

    gapi.load('client:auth2', initClient);
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [page, limit, statusFilter, searchTerm]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page,
        limit: limit,
      });

      if (statusFilter) queryParams.append('status', statusFilter);
      if (searchTerm) queryParams.append('search', searchTerm);

      const response = await fetch(
        `http://localhost:8000/job-applications/shortlisted-candidate?${queryParams}`
      );
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setCandidates(data.items);
      setTotalPages(data.pages);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatInterviewTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isInterviewActive = (candidate) => {
    if (
      !candidate.interview_form_url ||
      !candidate.interview_schedule ||
      !candidate.interview_duration ||
      !candidate.interviewer_email
    ) {
      console.warn(`Missing meeting data for candidate ${candidate.candidate_name}:`, {
        interview_form_url: candidate.interview_form_url,
        interview_schedule: candidate.interview_schedule,
        interview_duration: candidate.interview_duration,
        interviewer_email: candidate.interviewer_email,
        interview_title: candidate.interview_title,
        interview_description: candidate.interview_description,
      });
      return false;
    }

    const scheduleDate = new Date(candidate.interview_schedule);
    if (isNaN(scheduleDate.getTime())) {
      console.warn(`Invalid meeting date for candidate ${candidate.candidate_name}:`, candidate.interview_schedule);
      return false;
    }

    const now = new Date();
    const endTime = new Date(scheduleDate.getTime() + candidate.interview_duration * 60000);

    return now < endTime;
  };

  const handleConductInterview = (candidate) => {
    console.log('Handling interview for candidate:', {
      name: candidate.candidate_name,
      applicationId: candidate.application_id,
      isActive: isInterviewActive(candidate),
      meetingUrl: candidate.interview_form_url,
      schedule: candidate.interview_schedule,
      duration: candidate.interview_duration,
      title: candidate.interview_title,
      description: candidate.interview_description,
      interviewer_email: candidate.interviewer_email,
    });

    setSelectedCandidate(candidate);

    if (isInterviewActive(candidate)) {
      navigate('/interview', { state: { applicationId: candidate.application_id } });
    } else {
      setShowScheduler(true);
      setMeetingTitle(`Technical Interview: ${candidate.candidate_name} for ${candidate.job_title}`);
      setMeetingDescription(
        `Technical interview for the position of ${candidate.job_title} at ${candidate.company}.`
      );
    }
  };

  const handleScheduleMeeting = async () => {
    if (!selectedCandidate) return;

    if (!isGapiInitialized) {
      setSchedulingStatus({
        type: 'error',
        message: 'Google API client is not initialized. Please try again.',
      });
      return;
    }

    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
      try {
        await gapi.auth2.getAuthInstance().signIn();
      } catch (error) {
        setSchedulingStatus({
          type: 'error',
          message: 'Failed to sign in to Google. Please try again.',
        });
        return;
      }
    }

    setSchedulingStatus({ type: 'info', message: 'Scheduling meeting...' });

    try {
      const generateRequestId = () => {
        return 'meet-' + Math.random().toString(36).substring(2, 15);
      };

      const endTime = new Date(meetingDate);
      endTime.setMinutes(endTime.getMinutes() + parseInt(meetingDuration));

      const event = {
        summary: meetingTitle,
        description: meetingDescription,
        start: {
          dateTime: meetingDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: [
          { email: selectedCandidate.candidate_email },
          { email: selectedCandidate.interviewer_email },
        ],
        conferenceData: {
          createRequest: {
            requestId: generateRequestId(),
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      };

      console.log('Creating event with payload:', event);

      const response = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
      });

      const eventData = response.result;
      console.log('Event creation response:', eventData);

      let googleMeetLink = eventData.hangoutsMeetLink;
      if (!googleMeetLink && eventData.conferenceData?.entryPoints) {
        const meetEntryPoint = eventData.conferenceData.entryPoints.find(
          (entry) => entry.entryPointType === 'video'
        );
        googleMeetLink = meetEntryPoint?.uri;
      }

      if (!googleMeetLink) {
        throw new Error('Failed to generate Google Meet link');
      }

      await updateApplicationWithMeetingDetails(
        selectedCandidate.application_id,
        googleMeetLink,
        meetingDate.toISOString(),
        parseInt(meetingDuration),
        meetingTitle,
        meetingDescription
      );

      try {
        await sendCalendarInvite(
          selectedCandidate.candidate_email,
          selectedCandidate.interviewer_email,
          meetingTitle,
          meetingDescription,
          meetingDate.toISOString(),
          endTime.toISOString(),
          Intl.DateTimeFormat().resolvedOptions().timeZone,
          googleMeetLink
        );
        setSchedulingStatus({
          type: 'success',
          message: 'Meeting scheduled successfully! Calendar invite sent to candidate and interviewer.',
        });
      } catch (emailError) {
        console.error('Failed to send calendar invite:', emailError);
        setSchedulingStatus({
          type: 'warning',
          message: 'Meeting scheduled successfully, but failed to send calendar invite. Please check backend configuration.',
        });
      }

      setShowScheduler(false);
      navigate('/interview', { state: { applicationId: selectedCandidate.application_id } });
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      console.log('Error details:', error.result ? error.result.error : error);
      let errorMessage = error.message || error.result?.error?.message || 'Unknown error';
      if (error.result?.error?.code === 403 && error.result?.error?.status === 'PERMISSION_DENIED') {
        errorMessage = 'Access denied: Please ensure your Google account is added as a test user in the Google Cloud Console OAuth consent screen.';
      }
      setSchedulingStatus({
        type: 'error',
        message: `Failed to schedule meeting: ${errorMessage}`,
      });
    }
  };

  const updateApplicationWithMeetingDetails = async (
    applicationId,
    meetingUrl,
    schedule,
    duration,
    title,
    description
  ) => {
    try {
      const response = await fetch(`http://localhost:8000/job-applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Shortlisted',
          interview_form_url: meetingUrl,
          interview_schedule: schedule,
          interview_duration: duration,
          interview_title: title,
          interview_description: description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating application with meeting details:', error);
      throw error;
    }
  };

  const sendCalendarInvite = async (
    candidateEmail,
    interviewerEmail,
    summary,
    description,
    startTime,
    endTime,
    timezone,
    meetLink
  ) => {
    try {
      const response = await fetch('http://localhost:8000/calendar/send-calendar-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate_email: candidateEmail,
          interviewer_email: interviewerEmail,
          summary,
          description,
          start_time: startTime,
          end_time: endTime,
          timezone,
          meet_link: meetLink,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();
      console.log('Calendar invite sent:', result);
      return result;
    } catch (error) {
      console.error('Error sending calendar invite:', error);
      throw error;
    }
  };

  const handleBackToList = () => {
    setShowScheduler(false);
    setSelectedCandidate(null);
    setSchedulingStatus(null);
    setMeetingTitle("");
    setMeetingDescription("");
    setMeetingDate(new Date());
    setMeetingDuration(60);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCandidates();
  };

  if (showScheduler && selectedCandidate) {
    return (
      <div className="scheduler-container">
        <div className="scheduler-header">
          <button onClick={handleBackToList} className="back-button">
            ← Back to Candidates
          </button>
          <h1>Schedule Interview with {selectedCandidate.candidate_name}</h1>
        </div>

        <div className="scheduler-content">
          <div className="candidate-info">
            <h2>Candidate Information</h2>
            <div className="info-group">
              <label>Name:</label>
              <span>{selectedCandidate.candidate_name}</span>
            </div>
            <div className="info-group">
              <label>Candidate Email:</label>
              <span>{selectedCandidate.candidate_email}</span>
            </div>
            <div className="info-group">
              <label>Interviewer Email:</label>
              <span>{selectedCandidate.interviewer_email}</span>
            </div>
            <div className="info-group">
              <label>Position:</label>
              <span>
                {selectedCandidate.job_title} at {selectedCandidate.company}
              </span>
            </div>
          </div>

          <div className="meeting-form">
            <h2>Interview Details</h2>

            <div className="form-group">
              <label htmlFor="meeting-title">Meeting Title:</label>
              <input
                id="meeting-title"
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Enter meeting title"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="meeting-description">Meeting Description:</label>
              <textarea
                id="meeting-description"
                value={meetingDescription}
                onChange={(e) => setMeetingDescription(e.target.value)}
                placeholder="Enter meeting description"
                className="form-control"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="meeting-date">Date & Time:</label>
              <DatePicker
                id="meeting-date"
                selected={meetingDate}
                onChange={(date) => setMeetingDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="MMMM d, yyyy h:mm aa"
                className="form-control"
                minDate={new Date()}
              />
            </div>

            <div className="form-group">
              <label htmlFor="meeting-duration">Duration (minutes):</label>
              <select
                id="meeting-duration"
                value={meetingDuration}
                onChange={(e) => setMeetingDuration(e.target.value)}
                className="form-control"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </div>

            {schedulingStatus && (
              <div className={`scheduling-status ${schedulingStatus.type}`}>
                {schedulingStatus.message}
              </div>
            )}

            <div className="form-actions">
              <button onClick={handleBackToList} className="button secondary">
                Cancel
              </button>
              <button
                onClick={handleScheduleMeeting}
                className="button primary"
                disabled={!isGapiInitialized}
              >
                Schedule & Send Invite
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="candidates-container">
      <h1 className="title">Candidate Applications</h1>

      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={handleStatusChange}
            className="filter-select"
          >
            <option value="">All</option>
            <option value="Applied">Applied</option>
            <option value="Shortlisted">Shortlisted</option>
          </select>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search candidate, job title, company..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loading">Loading candidates...</div>
      ) : error ? (
        <div className="error">Error: {error}</div>
      ) : candidates.length === 0 ? (
        <div className="no-results">No candidates found matching your criteria.</div>
      ) : (
        <>
          <div className="candidates-table-wrapper">
            <table className="candidates-table">
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Email</th>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Applied Date</th>
                  <th>Interview Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate.application_id}>
                    <td>{candidate.candidate_name}</td>
                    <td>{candidate.candidate_email}</td>
                    <td>{candidate.job_title}</td>
                    <td>{candidate.company}</td>
                    <td>
                      <span className={`status-badge ${candidate.status.toLowerCase()}`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td>{formatDate(candidate.created_at)}</td>
                    <td>{candidate.interview_schedule ? formatInterviewTime(candidate.interview_schedule) : '----'}</td>
                    <td>
                      {candidate.status === "Shortlisted" && isInterviewActive(candidate) ? (
                        <button
                          onClick={() => handleConductInterview(candidate)}
                          className="interview-button scheduled"
                          title="View scheduled interview details"
                        >
                          View Details
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConductInterview(candidate)}
                          className="interview-button"
                          disabled={candidate.status !== "Shortlisted"}
                          title={
                            candidate.status !== "Shortlisted"
                              ? "Only shortlisted candidates can be interviewed"
                              : "Start interview"
                          }
                        >
                          Conduct Interview
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className="pagination-button"
            >
              Previous
            </button>
            <span className="page-info">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={page === totalPages}
              className="pagination-button"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ConductInterview;