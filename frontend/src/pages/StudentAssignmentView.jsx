import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssignmentDetail } from '../services/api'; 
import api from '../services/api'; 

const StudentAssignmentView = ({ assignmentId }) => {
    const params = useParams();
    const navigate = useNavigate();
    const activeId = assignmentId || params.id; 

    const [assignment, setAssignment] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const isPastDeadline = assignment?.deadline ? new Date() > new Date(assignment.deadline) : false;

    useEffect(() => {
        if (activeId) {
            loadAssignmentDetail();
        }
    }, [activeId]);

    const loadAssignmentDetail = async () => {
        try {
            const res = await getAssignmentDetail(activeId);
            setAssignment(res.data);
            
            if (res.data.my_submission) {
                setResult({
                    is_published: res.data.my_submission.is_published,
                    grade: res.data.my_submission.grade,
                    marks: res.data.my_submission.marks,
                    ai_detection: res.data.my_submission.ai_score,
                    plagiarism: res.data.my_submission.plagiarism_score,
                    feedback: res.data.my_submission.feedback
                });
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load assignment details.");
        }
    };

    const handleSubmitFile = async () => {
        if (!file) return alert("Please select a file (PDF or DOCX).");
        if (isPastDeadline) return alert("The deadline for this assignment has passed.");

        setLoading(true);
        setError('');
        
        const formData = new FormData();
        formData.append('assignment_id', activeId);
        formData.append('file', file); 

        try {
            const res = await api.post('/content/assignment/submit-and-grade', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(res.data); 
            alert("🚀 Assignment submitted and analyzed!");
        } catch (err) {
            const msg = err.response?.data?.error || err.message;
            setError("Submission Failed: " + msg);
        } finally {
            setLoading(false);
        }
    };

    if (!assignment) return <div className="loading-text">Loading Assignment Details...</div>;

    return (
        <div className="assignment-view-container">
            {/* Header */}
            <div className="assignment-header">
                <h2 className="assignment-title">{assignment.title}</h2>
                <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
            </div>
            
            {/* Instructions Box */}
            <div className="instructions-box">
                <strong className="instr-label">📋 Instructions:</strong>
                <p className="instr-text">{assignment.description}</p>
                <div className={`deadline-tag ${isPastDeadline ? 'expired' : ''}`}>
                    {isPastDeadline ? '❌ Deadline Passed' : `📅 Deadline: ${assignment.deadline ? new Date(assignment.deadline).toLocaleString() : 'No Deadline'}`}
                </div>
            </div>
            
            {error && (
                <div className="error-alert">
                    ⚠️ {error}
                </div>
            )}

            {!result ? (
                <div className="upload-section">
                    <label className="upload-label">
                        Upload your Solution (PDF/DOCX):
                    </label>
                    <div className="upload-controls">
                        <input 
                            type="file" 
                            accept=".pdf,.docx" 
                            disabled={isPastDeadline}
                            onChange={(e) => setFile(e.target.files[0])}
                            className="file-input"
                        />
                        <button 
                            onClick={handleSubmitFile} 
                            disabled={loading || isPastDeadline}
                            className="submit-grade-btn"
                        >
                            {loading ? 'Analyzing...' : 'Submit & Grade 🚀'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="results-section">
                    {!result.is_published ? (
                        <div className="review-pending-box">
                            <div className="pending-icon">⏳</div>
                            <h3>Submission Under Review</h3>
                            <p>Your assignment has been successfully analyzed. Results are hidden until the teacher publishes grades.</p>
                            <div className="hidden-badges-row">
                                <span className="hidden-badge">🔒 AI Score Hidden</span>
                                <span className="hidden-badge">🔒 Plagiarism Hidden</span>
                                <span className="hidden-badge">🔒 Grade Hidden</span>
                            </div>
                        </div>
                    ) : (
                        <div className="graded-box">
                            <h3 className="graded-title">✅ Graded & Verified</h3>
                            <div className="stats-grid">
                                <StatBox label="Grade" value={result.grade} color="#2563eb" />
                                <StatBox label="Marks" value={result.marks} color="#2563eb" />
                                <StatBox 
                                    label="AI Detection" value={`${result.ai_detection}%`} 
                                    color={result.ai_detection > 50 ? '#ef4444' : '#10b981'} 
                                    sub={result.ai_detection > 50 ? 'High AI Content' : 'Likely Human'}
                                />
                                <StatBox 
                                    label="Plagiarism" value={`${result.plagiarism}%`} 
                                    color={result.plagiarism > 50 ? '#ef4444' : '#10b981'}
                                    sub={result.plagiarism > 50 ? 'High Similarity' : 'Original Work'}
                                />
                            </div>
                            {result.feedback && (
                                <div className="feedback-box">
                                    <strong>📢 Teacher Feedback:</strong>
                                    <p>{result.feedback}</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <button onClick={() => setResult(null)} className="resubmit-btn">
                        Re-submit File
                    </button>
                </div>
            )}

            <style>{`
                .assignment-view-container { 
                    padding: 32px; 
                    background: white; 
                    border-radius: 14px; 
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05); 
                    border: 1px solid #e2e8f0; 
                    border-top: 5px solid #2563eb;
                    max-width: 1000px;
                    margin: 0 auto;
                }
                .loading-text { padding: 40px; text-align: center; color: #64748b; font-family: sans-serif; }
                
                .assignment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 15px; }
                .assignment-title { color: #0f172a; margin: 0; font-size: clamp(1.2rem, 4vw, 1.6rem); font-weight: 800; letter-spacing: -0.5px; }
                .back-btn { background: #f1f5f9; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; color: #475569; white-space: nowrap; }

                .instructions-box { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
                .instr-label { color:#1e293b; font-size: 1.05rem; display: flex; align-items: center; gap: 8px; }
                .instr-text { white-space: pre-wrap; color: #475569; margin-top: 12px; font-size: 0.95rem; lineHeight: 1.6; }
                
                .deadline-tag { 
                    display: inline-block; margin-top: 16px; padding: 6px 12px; border-radius: 8px; 
                    font-size: 0.85rem; font-weight: 700; background: white; border: 1px solid #cbd5e1; color: #64748b;
                }
                .deadline-tag.expired { color: #ef4444; border-color: #fecaca; }

                .error-alert { padding: 12px; background: #fee2e2; color: #b91c1c; border-radius: 8px; margin-bottom: 20px; font-weight: 600; }

                .upload-section { margin-top: 20px; }
                .upload-label { display: block; marginBottom: 12px; font-weight: 800; color: #1e293b; }
                .upload-controls { display: flex; gap: 12px; align-items: center; }
                
                .file-input { 
                    flex: 1; padding: 12px; border: 1.5px dashed #cbd5e1; border-radius: 10px; 
                    background: #f8fafc; color: #475569; cursor: pointer; min-width: 0; 
                }
                .submit-grade-btn { 
                    padding: 14px 28px; background: linear-gradient(135deg, #1d4ed8, #0284c7); 
                    border: none; border-radius: 10px; color: white; font-weight: 800; cursor: pointer; white-space: nowrap;
                }

                .review-pending-box { padding: 40px 20px; background: #fff7ed; border: 1px dashed #f97316; border-radius: 12px; text-align: center; color: #c2410c; }
                .pending-icon { font-size: 3rem; margin-bottom: 10px; }
                .hidden-badges-row { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-top: 20px; }
                .hidden-badge { background: white; border: 1px solid #fed7aa; padding: 6px 14px; border-radius: 20px; fontSize: 0.8rem; fontWeight: 700; color: #9a3412; }

                .graded-box { padding: 24px; border: 1px solid #bbf7d0; border-radius: 12px; background: #f0fdf4; }
                .graded-title { margin: 0 0 20px 0; color: #166534; display: flex; align-items: center; gap: 8px; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 15px; margin-bottom: 20px; }
                
                .feedback-box { background: white; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0; margin-top: 20px; }
                .feedback-box strong { color: #1e293b; display: block; margin-bottom: 8px; }
                .feedback-box p { color: #475569; line-height: 1.5; margin: 0; }

                .resubmit-btn { margin-top: 20px; padding: 10px 20px; background: none; color: #64748b; border: 1px solid #cbd5e1; borderRadius: 8px; cursor: pointer; fontWeight: 600; }

                /* Responsiveness */
                @media (max-width: 600px) {
                    .assignment-view-container { padding: 20px; }
                    .assignment-header { flex-direction: column; align-items: flex-start; }
                    .back-btn { width: 100%; text-align: center; }
                    .upload-controls { flex-direction: column; align-items: stretch; }
                    .submit-grade-btn { width: 100%; }
                }
            `}</style>
        </div>
    );
};

const StatBox = ({ label, value, color, sub }) => (
    <div className="stat-box-container" style={{ borderLeft: `5px solid ${color}` }}>
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color: color }}>{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
        <style>{`
            .stat-box-container { background: white; padding: 18px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
            .stat-label { fontSize: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
            .stat-value { fontSize: 1.6rem; font-weight: 900; margin: 6px 0; }
            .stat-sub { fontSize: 0.7rem; color: #94a3b8; font-weight: 600; }
        `}</style>
    </div>
);

export default StudentAssignmentView;