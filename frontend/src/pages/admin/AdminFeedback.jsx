import React, { useState, useEffect } from 'react';
import { getAllFeedback } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const AdminFeedback = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAllFeedback();
        setReviews(res.data.reviews || []);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  return (
    <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
                <h1 style={{ margin: 0, color: '#1e293b' }}>📢 Student Feedback</h1>
                <p style={{ margin: 0, color: '#64748b' }}>Monitoring course quality and satisfaction.</p>
            </div>
            <button onClick={() => navigate(-1)} className="btn-secondary">Back to Dashboard</button>
        </div>

        {loading ? <p>Loading feedback...</p> : reviews.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No feedback submitted yet.</div>
        ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
                {reviews.map(r => (
                    <div key={r.id} className="card" style={{ padding: '25px', background: 'white', borderRadius: '12px', borderLeft: r.rating < 3 ? '6px solid #ef4444' : '6px solid #10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem' }}>{r.course}</h3>
                                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Instructor: <strong style={{ color: '#334155' }}>{r.teacher}</strong></div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: '#fbbf24', fontSize: '1.4rem', letterSpacing: '2px' }}>{"★".repeat(r.rating)}<span style={{ color: '#e2e8f0' }}>{"★".repeat(5-r.rating)}</span></div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{r.date}</div>
                            </div>
                        </div>
                        
                        {r.comment && (
                            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginTop: '15px', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '1.5rem', color: '#cbd5e1', lineHeight: 0, verticalAlign: 'sub' }}>"</span>
                                <span style={{ fontStyle: 'italic', color: '#334155', margin: '0 5px' }}>{r.comment}</span>
                                <span style={{ fontSize: '1.5rem', color: '#cbd5e1', lineHeight: 0, verticalAlign: 'sub' }}>"</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeedback;