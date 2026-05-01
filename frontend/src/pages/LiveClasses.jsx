import React, { useState, useEffect, useContext } from 'react';
import { getAllLiveSessions, createLiveSession, getCourses, deleteLiveSession } from '../services/api'; 
import { AuthContext } from '../context/AuthContext';

const LiveClasses = () => {
  const { user } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  
  const [formData, setFormData] = useState({ course_id: '', title: '', start_time: '', meeting_link: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  // inside loadData
  const loadData = async () => {
    try {
        setLoading(true);
        const sessRes = await getAllLiveSessions();
        // ENSURE the backend is returning sessions for ENROLLED courses only
        setSessions(sessRes.data.sessions || []); 
        
        // If a teacher, we need the list of courses they teach to populate the dropdown
        if (user.role === 'teacher') {
            const courseRes = await getCourses();
            setCourses(courseRes.data.courses || []);
        }
    } catch (err) { 
        console.error("Live Class Load Error:", err); 
    } finally {
        setLoading(false);
    }
};

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      await createLiveSession(formData);
      alert('Class Scheduled & Students Notified!');
      setFormData({ course_id: '', title: '', start_time: '', meeting_link: '' });
      loadData();
    } catch (err) { 
      alert('Error scheduling class. Please try again.'); 
    }
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm("Are you sure you want to cancel this live session?")) return;
    try {
        await deleteLiveSession(sessionId);
        setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (err) {
        console.error(err);
        alert("Failed to delete session.");
    }
  };

  return (
    <div className="live-page-wrapper">

      {/* 1. HERO HEADER */}
      <header className="live-hero">
        <div className="hero-overlay" />
        <div className="hero-container">
          <h1>Live Classroom</h1>
          <p>Connect with your students in real-time virtual sessions.</p>
        </div>
      </header>
      
      <div className="live-content-container">

        {/* 2. TEACHER SCHEDULING CARD */}
        {user.role === 'teacher' && (
          <div className="schedule-card">
            <div className="card-header-flex">
              <div className="icon-bg">📅</div>
              <div>
                <h3>Schedule Session</h3>
                <p>Notify enrolled students instantly.</p>
              </div>
            </div>

            <form onSubmit={handleSchedule} className="schedule-form">
              <div className="full-width">
                <label>Select Course</label>
                <select 
                  onChange={e => setFormData({...formData, course_id: e.target.value})}
                  value={formData.course_id}
                  required
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.class_code})</option>)}
                </select>
              </div>

              <div>
                <label>Class Topic</label>
                <input 
                  placeholder="e.g. Chapter 4: Neural Networks" 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  value={formData.title}
                  required
                />
              </div>

              <div>
                <label>Meeting Link (Optional)</label>
                <input 
                  type="url"
                  placeholder="Zoom/Meet Link" 
                  onChange={e => setFormData({...formData, meeting_link: e.target.value})}
                  value={formData.meeting_link}
                />
              </div>

              <div className="full-width-mobile">
                <label>Date & Time</label>
                <input 
                  type="datetime-local" 
                  onChange={e => setFormData({...formData, start_time: e.target.value})}
                  value={formData.start_time}
                  required
                />
              </div>

              <div className="full-width">
                <button type="submit" className="schedule-btn">
                  Schedule & Notify Students 🚀
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. UPCOMING SESSIONS LIST */}
        <h3 className="list-title">Upcoming Sessions</h3>

        {loading ? (
            <p className="loading-text">Loading schedule...</p>
        ) : sessions.length === 0 ? (
            <div className="empty-state">
                <h3>No live classes scheduled.</h3>
                {user.role === 'teacher' && <p>Use the form above to schedule your first class.</p>}
            </div>
        ) : (
            <div className="sessions-grid">
              {sessions.map(s => (
              <div key={s.id} className="session-card">
                <div className="session-top">
                  <span className="live-pill">
                    <span className="dot"></span>
                    LIVE SESSION
                  </span>
                  {/* CHANGE: s.class_code -> s.course_code */}
                  <span className="course-tag">{s.course_code || 'Class'}</span>
                </div>

                    <h3 className="session-title">{s.title}</h3>
                    
                    <div className="session-details">
                        <p className="course-name"><strong>Subject:</strong> {s.course_name}</p>
                        <p className="session-date">
                            📅 {new Date(s.start_time).toLocaleString(undefined, { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                        </p>
                    </div>
                    
                    <div className="session-actions">
                        <a href={s.meeting_link} target="_blank" rel="noreferrer" className="join-btn">
                            Enter Classroom →
                        </a>
                        {user.role === 'teacher' && (
                            <button onClick={() => handleDelete(s.id)} className="cancel-btn">
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            ))}
            </div>
        )}
      </div>

      <style>{`
        .live-page-wrapper { background: #f8fafc; min-height: 100vh; padding-bottom: 60px; font-family: 'Inter', sans-serif; }
        
        .live-hero { 
          background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); 
          padding: 40px 0 100px; position: relative; overflow: hidden; 
        }
          .course-tag {
          background: #f1f5f9;
          color: #475569;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: uppercase;
      }

      .session-details {
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 5px;
      }

      .session-date {
          font-size: 0.85rem !important;
          color: #2563eb !important; /* Make the time blue so it stands out */
          font-weight: 700 !important;
      }
        .hero-overlay { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 28px 28px; }
        .hero-container { max-width: 1000px; margin: 0 auto; padding: 0 24px; position: relative; }
        .hero-container h1 { color: white; font-size: clamp(1.8rem, 5vw, 2.5rem); font-weight: 900; margin: 0; }
        .hero-container p { color: rgba(255,255,255,0.8); margin-top: 8px; font-size: 1rem; }

        .live-content-container { max-width: 1000px; margin: -50px auto 0; padding: 0 20px; position: relative; z-index: 10; }

        .schedule-card { background: white; padding: 30px; border-radius: 16px; border-left: 6px solid #2563eb; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
        .card-header-flex { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; }
        .icon-bg { background: #eff6ff; padding: 12px; border-radius: 10px; font-size: 1.5rem; }
        
        .schedule-form { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .schedule-form .full-width { grid-column: 1 / -1; }
        
        label { display: block; margin-bottom: 8px; font-weight: 700; fontSize: 0.85rem; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; }
        input, select { width: 100%; padding: 12px 15px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #f8fafc; color: #0f172a; font-family: inherit; outline: none; transition: 0.2s; }
        input:focus, select:focus { border-color: #2563eb; background: #fff; }

        .schedule-btn { width: 100%; padding: 14px; background: #1d4ed8; color: white; border: none; border-radius: 8px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(29, 78, 216, 0.2); font-size: 1rem; }

        .list-title { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin: 40px 0 25px; color: #0f172a; font-weight: 800; }
        .sessions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 310px), 1fr)); gap: 20px; }

        .session-card { padding: 24px; background: white; border-radius: 16px; border: 1px solid #e2e8f0; border-top: 5px solid #ef4444; display: flex; flex-direction: column; transition: 0.3s; }
        .session-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .live-pill { background: #fef2f2; color: #dc2626; font-weight: 800; font-size: 0.75rem; padding: 5px 10px; border-radius: 6px; display: flex; align-items: center; gap: 6px; }
        .dot { width: 6px; height: 6px; background: #dc2626; border-radius: 50%; }
        .session-date { font-size: 0.85rem; color: #64748b; font-weight: 600; }
        .session-title { font-size: 1.15rem; margin: 0 0 10px; color: #0f172a; font-weight: 800; }
        .course-name { color: #64748b; font-size: 0.9rem; margin-bottom: 20px; }
        
        .session-actions { display: flex; gap: 10px; margin-top: auto; }
        .join-btn { flex: 2; text-align: center; background: #ef4444; color: white; text-decoration: none; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 0.9rem; }
        .cancel-btn { flex: 1; background: #f8fafc; color: #dc2626; border: 1.5px solid #e2e8f0; border-radius: 8px; font-weight: 600; cursor: pointer; }

        .empty-state { padding: 60px 20px; text-align: center; background: white; border-radius: 16px; border: 2px dashed #cbd5e1; color: #64748b; }
        .loading-text { text-align: center; padding: 40px; color: #64748b; }

        @media (max-width: 650px) {
          .schedule-form { grid-template-columns: 1fr; }
          .live-hero { text-align: center; padding-bottom: 80px; }
          .live-content-container { margin-top: -40px; }
          .session-card { padding: 20px; }
        }
      `}</style>
    </div>
  );
};

export default LiveClasses;