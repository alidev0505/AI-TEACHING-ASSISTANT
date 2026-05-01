import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentAttendance = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://127.0.0.1:5000/api/content/attendance/student/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStats(data.stats);
    } catch (err) {
      console.error("Failed to load stats", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (pct) => {
    if (pct >= 75) return '#10b981'; // Green
    if (pct >= 60) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  if (loading) return <div style={{ padding: '100px 20px', textAlign: 'center', color: '#64748b' }}>Loading Attendance...</div>;

  return (
    <div className="attendance-wrapper">
      
      {/* 1. HERO HEADER */}
      <div className="attendance-hero">
        <div className="hero-overlay" />
        <div className="hero-container">
          <button onClick={() => navigate(-1)} className="back-btn">
            ← Back
          </button>
          <h1>My Attendance</h1>
          <p>Track your presence across all enrolled courses.</p>
        </div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="attendance-content">
        {stats.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No records yet.</h3>
          </div>
        ) : (
          <div className="attendance-grid">
            {stats.map((course) => (
              <div key={course.course_id} className="attendance-card" style={{ borderTop: `5px solid ${getStatusColor(course.percentage)}` }}>
                
                {/* Course Header */}
                <div className="card-header">
                  <div className="course-info">
                    <h3>{course.course_name}</h3>
                    <span className="class-code">{course.class_code}</span>
                  </div>
                </div>

                {/* Percentage Section */}
                <div className="percentage-display">
                  <span className="percentage-text" style={{ color: getStatusColor(course.percentage) }}>
                    {course.percentage}%
                  </span>
                  <div className="rate-label">Attendance Rate</div>
                </div>

                {/* Progress Bar */}
                <div className="progress-container">
                  <div className="progress-fill" style={{ width: `${course.percentage}%`, background: getStatusColor(course.percentage) }} />
                </div>

                {/* Mini Stats Grid */}
                <div className="mini-stats-grid">
                  <div className="mini-stat present">
                    <div className="val">{course.present}</div>
                    <div className="lab">Present</div>
                  </div>
                  <div className="mini-stat absent">
                    <div className="val">{course.absent}</div>
                    <div className="lab">Absent</div>
                  </div>
                  <div className="mini-stat total">
                    <div className="val">{course.total_sessions}</div>
                    <div className="lab">Total</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .attendance-wrapper { background: #f8fafc; min-height: 100vh; padding-bottom: 60px; font-family: 'Inter', sans-serif; }
        
        .attendance-hero { 
          background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); 
          padding: 40px 0 100px; position: relative; overflow: hidden; 
        }
        .hero-overlay { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 28px 28px; }
        .hero-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; position: relative; }
        .hero-container h1 { color: white; font-size: clamp(1.8rem, 5vw, 2.5rem); font-weight: 900; margin: 0; letter-spacing: -1px; }
        .hero-container p { color: rgba(255,255,255,0.7); margin-top: 8px; font-size: 1rem; }
        
        .back-btn { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; margin-bottom: 20px; }

        .attendance-content { max-width: 1280px; margin: -50px auto 0; padding: 0 20px; position: relative; z-index: 10; }

        .attendance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap: 20px; }

        .attendance-card { background: white; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .course-info h3 { margin: 0 0 5px; font-size: 1.1rem; color: #1e293b; line-height: 1.3; font-weight: 800; }
        .class-code { background: #f1f5f9; padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; color: #64748b; font-weight: 700; }

        .percentage-display { text-align: center; margin-bottom: 20px; }
        .percentage-text { font-size: clamp(2.5rem, 8vw, 3.2rem); font-weight: 900; line-height: 1; display: block; }
        .rate-label { color: #64748b; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-top: 8px; }

        .progress-container { height: 8px; background: #e2e8f0; border-radius: 10px; margin-bottom: 25px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 10px; transition: width 1s ease-in-out; }

        .mini-stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; text-align: center; }
        .mini-stat { padding: 10px 5px; border-radius: 10px; }
        .mini-stat .val { font-weight: 800; font-size: 1.1rem; }
        .mini-stat .lab { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; margin-top: 2px; }

        .present { background: #ecfdf5; color: #047857; }
        .absent { background: #fef2f2; color: #b91c1c; }
        .total { background: #f8fafc; color: #475569; }

        .empty-state { padding: 80px 20px; text-align: center; background: white; border-radius: 16px; border: 1px solid #e2e8f0; }
        .empty-icon { font-size: 3rem; margin-bottom: 15px; opacity: 0.3; }

        @media (max-width: 600px) {
          .attendance-hero { padding-bottom: 80px; text-align: center; }
          .attendance-content { margin-top: -40px; }
          .attendance-card { padding: 20px; }
        }
      `}</style>
    </div>
  );
};

export default StudentAttendance;