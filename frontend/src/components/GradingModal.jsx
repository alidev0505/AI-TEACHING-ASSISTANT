import React, { useState } from 'react';
import { publishGrade } from '../services/api';

const GradingModal = ({ submission, assignmentTitle, onClose, onSuccess }) => {
    const [marks, setMarks] = useState(submission.marks || 0);
    const [grade, setGrade] = useState(submission.grade || 'F');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePublish = async () => {
        setLoading(true);
        setError('');
        console.log('Publishing grade for submission:', submission);
        try {
            const payload = {
                submission_id: submission.id,
                marks: parseFloat(marks),
                grade: grade
            };
            console.log('Payload:', payload);
            await publishGrade(payload);
            alert("Grade Published Successfully!");
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Publish error:', err);
            const msg = err.response?.data?.error || err.message || 'Unknown error';
            setError(`Failed to publish: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h3>Grading: {submission.student_name}</h3>
                    <button onClick={onClose} style={styles.closeBtn}>&times;</button>
                </div>

                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Assignment: {assignmentTitle}</p>

                {/* AI Analysis Section */}
                <div style={styles.aiSection}>
                    <h4>🤖 AI Analysis</h4>
                    <div style={styles.statGrid}>
                        <div style={styles.stat}>
                            <span>AI Detection</span>
                            <strong style={{ color: submission.ai_score > 60 ? 'red' : 'green' }}>
                                {submission.ai_score}%
                            </strong>
                        </div>
                        <div style={styles.stat}>
                            <span>Plagiarism</span>
                            <strong style={{ color: submission.plagiarism_score > 50 ? 'red' : 'green' }}>
                                {submission.plagiarism_score}%
                            </strong>
                        </div>
                        <div style={styles.stat}>
                            <span>Content Match</span>
                            <strong style={{ color: '#3b82f6' }}>
                                {submission.similarity_score ? (submission.similarity_score * 100).toFixed(0) : 0}%
                            </strong>
                        </div>
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '0.85rem', background: 'white', padding: '10px', borderRadius: '4px' }}>
                        <strong>AI Feedback:</strong> {submission.feedback || "No feedback generated."}
                    </div>
                </div>

                {/* Manual Grading Section */}
                <div style={{ marginTop: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}><strong>Final Marks (0-100)</strong></label>
                    <input
                        type="number"
                        value={marks}
                        onChange={e => setMarks(e.target.value)}
                        style={styles.input}
                    />

                    <label style={{ display: 'block', marginBottom: '5px', marginTop: '10px' }}><strong>Grade Letter</strong></label>
                    <select value={grade} onChange={e => setGrade(e.target.value)} style={styles.input}>
                        <option value="A+">A+</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="F">F</option>
                    </select>
                </div>

                <div style={styles.footer}>
                    {error && (
                        <div style={{ width: '100%', padding: '8px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '10px', border: '1px solid #fecaca' }}>
                            ⚠ {error}
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
                        <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
                        <button onClick={handlePublish} disabled={loading} style={styles.publishBtn}>
                            {loading ? "Publishing..." : "✅ Publish Grade"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { background: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' },
    aiSection: { background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '15px' },
    statGrid: { display: 'flex', justifyContent: 'space-between', gap: '10px' },
    stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.9rem' },
    input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' },
    footer: { marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' },
    cancelBtn: { padding: '10px 20px', border: 'none', background: '#e2e8f0', borderRadius: '6px', cursor: 'pointer' },
    publishBtn: { padding: '10px 20px', border: 'none', background: '#10b981', color: 'white', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }
};

export default GradingModal;