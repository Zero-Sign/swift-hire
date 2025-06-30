import React, { useState, useEffect } from 'react';
import './InterviewPage.css';

const InterviewPage = ({ applicationId, onBack, userEmail }) => {
    const [applicationData, setApplicationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [customTitle, setCustomTitle] = useState("");
    const [showCandidateProfile, setShowCandidateProfile] = useState(true);
    const [showInterviewDetails, setShowInterviewDetails] = useState(true);
    const [newNote, setNewNote] = useState("");
    const [editingNote, setEditingNote] = useState(null); // Track note being edited
    const [editContent, setEditContent] = useState(""); // Content of note being edited

    useEffect(() => {
        const fetchApplicationData = async () => {
            if (!applicationId) {
                setError("No application ID provided.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/job-applications/${applicationId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                setApplicationData(data);
                const title = data.interview_title ||
                    `Interview: ${data.candidate_name || 'Unknown Candidate'} for ${data.job_title || 'Not specified'}`;
                setCustomTitle(title);
            } catch (err) {
                setError(`Failed to load interview data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchApplicationData();
    }, [applicationId]);

    const formatMeetingDateTime = (dateString) => {
        if (!dateString) return 'Not scheduled';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleJoinMeeting = () => {
        if (applicationData?.interview_form_url) {
            window.open(applicationData.interview_form_url, '_blank', 'noopener,noreferrer');
        } else {
            setFeedback({
                type: 'error',
                message: 'No meeting URL available.'
            });
        }
    };

    const copyMeetingLink = () => {
        if (applicationData?.interview_form_url) {
            navigator.clipboard.writeText(applicationData.interview_form_url);
            setFeedback({
                type: 'success',
                message: 'Meeting link copied to clipboard!'
            });
            setTimeout(() => setFeedback(null), 3000);
        } else {
            setFeedback({
                type: 'error',
                message: 'No meeting URL available.'
            });
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) {
            setFeedback({
                type: 'error',
                message: 'Note cannot be empty.'
            });
            return;
        }

        const effectiveEmail = userEmail && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(userEmail)
            ? userEmail
            : applicationData?.interviewer_email;

        if (!effectiveEmail) {
            setFeedback({
                type: 'error',
                message: 'Interviewer email not available. Please ensure you are logged in or contact support.'
            });
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/job-applications/${applicationId}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    application_id: Number(applicationId),
                    content: newNote.trim(),
                    created_by: effectiveEmail
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to add note');
            }

            const updatedResponse = await fetch(`http://localhost:8000/job-applications/${applicationId}`);
            if (!updatedResponse.ok) {
                throw new Error(`Failed to refresh application data: ${updatedResponse.status}`);
            }
            const updatedData = await updatedResponse.json();
            setApplicationData(updatedData);
            setNewNote("");
            setFeedback({
                type: 'success',
                message: 'Note added successfully!'
            });
            setTimeout(() => setFeedback(null), 3000);
        } catch (err) {
            setFeedback({
                type: 'error',
                message: `Failed to add note: ${err.message}`
            });
        }
    };

    const handleEditNote = (note) => {
        setEditingNote(note.id);
        setEditContent(note.content);
    };

    const handleUpdateNote = async (noteId) => {
        if (!editContent.trim()) {
            setFeedback({
                type: 'error',
                message: 'Note cannot be empty.'
            });
            return;
        }

        const effectiveEmail = userEmail && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(userEmail)
            ? userEmail
            : applicationData?.interviewer_email;

        if (!effectiveEmail) {
            setFeedback({
                type: 'error',
                message: 'Interviewer email not available. Please ensure you are logged in or contact support.'
            });
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/job-applications/notes/${noteId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: editContent.trim(),
                    created_by: effectiveEmail
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to update note');
            }

            const updatedResponse = await fetch(`http://localhost:8000/job-applications/${applicationId}`);
            if (!updatedResponse.ok) {
                throw new Error(`Failed to refresh application data: ${updatedResponse.status}`);
            }
            const updatedData = await updatedResponse.json();
            setApplicationData(updatedData);
            setEditingNote(null);
            setEditContent("");
            setFeedback({
                type: 'success',
                message: 'Note updated successfully!'
            });
            setTimeout(() => setFeedback(null), 3000);
        } catch (err) {
            setFeedback({
                type: 'error',
                message: `Failed to update note: ${err.message}`
            });
        }
    };

    const handleDeleteNote = async (noteId) => {
       
        const effectiveEmail = userEmail && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(userEmail)
            ? userEmail
            : applicationData?.interviewer_email;

        if (!effectiveEmail) {
            setFeedback({
                type: 'error',
                message: 'Interviewer email not available. Please ensure you are logged in or contact support.'
            });
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/job-applications/notes/${noteId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    created_by: effectiveEmail
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to delete note');
            }

            const updatedResponse = await fetch(`http://localhost:8000/job-applications/${applicationId}`);
            if (!updatedResponse.ok) {
                throw new Error(`Failed to refresh application data: ${updatedResponse.status}`);
            }
            const updatedData = await updatedResponse.json();
            setApplicationData(updatedData);
            setFeedback({
                type: 'success',
                message: 'Note deleted successfully!'
            });
            setTimeout(() => setFeedback(null), 3000);
        } catch (err) {
            setFeedback({
                type: 'error',
                message: `Failed to delete note: ${err.message}`
            });
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading">Loading interview data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error">{error}</div>
                <button onClick={onBack} className="back-button" title="Return to candidate list">
                    ← Back to Candidates
                </button>
            </div>
        );
    }

    if (!applicationData) {
        return (
            <div className="error-container">
                <div className="error">No application data found.</div>
                <button onClick={onBack} className="back-button" title="Return to candidate list">
                    ← Back to Candidates
                </button>
            </div>
        );
    }

    return (
        <div className={`interview-page ${!showCandidateProfile && !showInterviewDetails ? 'expanded-view' : ''}`}>
            <div className={`sidebar ${!showCandidateProfile ? 'collapsed' : ''}`}>
                <div className="sidebar-toggle-container">
                    <button 
                        className="sidebar-toggle" 
                        onClick={() => setShowCandidateProfile(!showCandidateProfile)}
                        aria-label={showCandidateProfile ? "Hide candidate profile" : "Show candidate profile"}
                        title={showCandidateProfile ? "Hide candidate profile" : "Show candidate profile"}
                    >
                        <span className="toggle-icon">{showCandidateProfile ? '◄' : '►'}</span>
                    </button>
                </div>
                
                {showCandidateProfile && (
                    <>
                        <div className="sidebar-section">
                            <h2 className="sidebar-title">Candidate Profile</h2>
                            <div className="sidebar-content">
                                <p><strong>Name:</strong> {applicationData.candidate_name || 'Unknown'}</p>
                                <p><strong>Email:</strong> {applicationData.candidate_email || 'Not provided'}</p>
                                <p><strong>Job title:</strong> {applicationData.job_title || 'Not specified'}</p>
                                <p><strong>Company:</strong> {applicationData.company || 'Not specified'}</p>
                                <p><strong>Status:</strong> <span className={`status-badge ${applicationData.status?.toLowerCase() || ''}`}>{applicationData.status || 'Unknown'}</span></p>
                            </div>
                        </div>
                        <div className="sidebar-section">
                            <h2 className="sidebar-title">Actions</h2>
                            <div className="sidebar-actions">
                                <button
                                    onClick={handleJoinMeeting}
                                    className={`action-button ${!applicationData.interview_form_url ? 'disabled' : ''}`}
                                    disabled={!applicationData.interview_form_url}
                                    title="Join the scheduled interview meeting"
                                    aria-label="Join interview meeting"
                                >
                                    Join Meeting
                                </button>
                                <button
                                    onClick={copyMeetingLink}
                                    className={`action-button ${!applicationData.interview_form_url ? 'disabled' : ''}`}
                                    disabled={!applicationData.interview_form_url}
                                    title="Copy meeting link to clipboard"
                                    aria-label="Copy meeting link"
                                >
                                    Copy Meeting Link
                                </button>
                                <button
                                    onClick={onBack}
                                    className="action-button secondary"
                                    title="Return to candidate list"
                                    aria-label="Back to candidates"
                                >
                                    Back to Candidates
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className={`main-content ${!showCandidateProfile ? 'expanded' : ''}`}>
                <div className="header">
                    <div className="interview-header-content">
                        <h1 className="title">{customTitle}</h1>
                    </div>
                </div>

                <div className={`content-area ${!showInterviewDetails ? 'expanded' : ''}`}>
                    <div className="main-column">
                        <div className="notes-section">
                            <h3>Notes</h3>
                            {applicationData.notes && applicationData.notes.length > 0 ? (
                                <div className="notes-list">
                                    {applicationData.notes.map((note) => (
                                        <div key={note.id} className="note-item">
                                            {editingNote === note.id ? (
                                                <div className="note-edit-form">
                                                    <textarea
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        className="form-control"
                                                        rows="3"
                                                        maxLength={1000}
                                                        aria-label="Edit note"
                                                    />
                                                    <div className="note-actions">
                                                        <button
                                                            onClick={() => handleUpdateNote(note.id)}
                                                            className="action-button"
                                                            disabled={!editContent.trim()}
                                                            title="Save note"
                                                            aria-label="Save note"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingNote(null)}
                                                            className="action-button secondary"
                                                            title="Cancel edit"
                                                            aria-label="Cancel edit"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="note-content">{note.content}</p>
                                                    <p className="note-meta">
                                                        By {note.created_by} on {new Date(note.created_at).toLocaleString()}
                                                    </p>
                                                    <div className="note-actions">
                                                        <button
                                                            onClick={() => handleEditNote(note)}
                                                            className="action-button secondary"
                                                            title="Edit note"
                                                            aria-label="Edit note"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteNote(note.id)}
                                                            className="action-button danger"
                                                            title="Delete note"
                                                            aria-label="Delete note"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>No notes available.</p>
                            )}
                            <div className="add-note-form">
                                <textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Add a new note..."
                                    className="form-control"
                                    rows="3"
                                    title="Add new note"
                                    aria-label="Add new note"
                                    maxLength={1000}
                                />
                                <button
                                    onClick={handleAddNote}
                                    className="action-button"
                                    disabled={!newNote.trim()}
                                    title="Add note"
                                    aria-label="Add note"
                                >
                                    Add Note
                                </button>
                            </div>
                        </div>
                    </div>

                    {showInterviewDetails && (
                        <div className="interview-details-panel">
                            <div className="meeting-info">
                                <h3>Interview Details</h3>
                                <div className="meeting-details">
                                    <p><strong>Scheduled Time:</strong> {formatMeetingDateTime(applicationData.interview_schedule)}</p>
                                    <p><strong>Duration:</strong> {applicationData.interview_duration || 'N/A'} minutes</p>
                                    <p><strong>Interviewer:</strong> {applicationData.interviewer_email || 'Not assigned'}</p>
                                    <div className="meeting-link-container">
                                        <p><strong>Meeting Link:</strong></p>
                                        <div className="meeting-link-actions">
                                            <a
                                                href={applicationData.interview_form_url || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={applicationData.interview_form_url ? '' : 'disabled'}
                                                aria-disabled={!applicationData.interview_form_url}
                                            >
                                                {applicationData.interview_form_url || 'No meeting link available'}
                                            </a>
                                            {applicationData.interview_form_url && (
                                                <button
                                                    className="copy-button"
                                                    onClick={copyMeetingLink}
                                                    title="Copy meeting link"
                                                    aria-label="Copy meeting link"
                                                >
                                                    Copy
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {!showInterviewDetails && (
                        <button 
                            className="show-details-button"
                            onClick={() => setShowInterviewDetails(true)}
                            aria-label="Show interview details"
                            title="Show interview details"
                        >
                            <span className="toggle-icon">◄</span>
                        </button>
                    )}
                </div>

                {feedback && (
                    <div className={`feedback-alert ${feedback.type}`} role="alert">
                        {feedback.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InterviewPage;