import React, { useState } from 'react';
import { createLiveSession } from '../services/api';

const CreateSessionModal = ({ courseId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ title: '', meeting_link: '', start_time: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createLiveSession({ ...formData, course_id: courseId });
      alert("Class Scheduled Successfully!");
      onSuccess(); 
      onClose();   
    } catch (err) {
      console.error(err);
      alert("Failed to schedule class.");
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
      <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '30px', background: 'white', borderRadius: '12px' }}>
        <h2 style={{ marginTop: 0, color: '#1e293b', textAlign: 'center' }}>📅 Schedule Live Class</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#64748b' }}>Topic / Title</label>
            <input 
                required
                type="text" 
                placeholder="e.g. Week 4: Deep Learning"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '5px' }}
            />
          </div>

          <div>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#64748b' }}>Meeting Link (Zoom/Meet)</label>
            <input 
                type="url" 
                placeholder="https://zoom.us/j/... (Leave empty for Jitsi)"
                value={formData.meeting_link}
                onChange={e => setFormData({...formData, meeting_link: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '5px' }}
            />
          </div>

          <div>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#64748b' }}>Date & Time</label>
            <input 
                required
                type="datetime-local" 
                value={formData.start_time}
                onChange={e => setFormData({...formData, start_time: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '5px' }}
            />
          </div>

          <div>
             <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#64748b' }}>Description (Optional)</label>
             <textarea 
                rows="3"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '5px' }}
             />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>
              {loading ? 'Confirm' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSessionModal;