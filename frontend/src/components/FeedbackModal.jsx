import React, { useState } from 'react';
import { submitFeedback } from '../services/api';

const FeedbackModal = ({ courseId, onClose }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitFeedback(courseId, { rating, comment });
      alert("Thank you for your feedback!");
      onClose(); // Close modal on success
    } catch (err) {
      alert(err.response?.data?.error || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '30px', background: 'white', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0, textAlign: 'center', color: '#1e293b' }}>Rate this Course</h2>
        
        <form onSubmit={handleSubmit}>
          {/* STAR RATING */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', fontSize: '2.5rem', cursor: 'pointer' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span 
                key={star} 
                onClick={() => setRating(star)} 
                style={{ color: star <= rating ? '#fbbf24' : '#cbd5e1', transition: 'color 0.2s' }}
              >
                ★
              </span>
            ))}
          </div>
          
          <p style={{ textAlign: 'center', margin: '-15px 0 20px', color: '#64748b', fontSize: '0.9rem' }}>
            {rating === 5 ? "Excellent! 🤩" : rating === 4 ? "Good 🙂" : rating === 3 ? "Average 😐" : rating === 2 ? "Poor 😞" : "Terrible 😡"}
          </p>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>Comments (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or dislike?"
              rows="4"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;