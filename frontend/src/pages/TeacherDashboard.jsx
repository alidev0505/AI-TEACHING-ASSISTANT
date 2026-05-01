import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getActiveSemesters, getTeacherSemesterCourses, createCourse } from '../services/api';
import AnnouncementBanner from '../components/AnnouncementBanner';

const COURSE_ACCENTS = ['#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0284c7'];
const COURSE_BG = ['#eff6ff', '#ecfeff', '#f0fdf4', '#fffbeb', '#fef2f2', '#f5f3ff', '#e0f2fe'];

const TeacherDashboard = () => {
  const { user } = useContext(AuthContext);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newCourseData, setNewCourseData] = useState({ name: '', description: '' });

  useEffect(() => { fetchSemesters(); }, []);

  const fetchSemesters = async () => {
    try { const res = await getActiveSemesters(); setSemesters(res.data.semesters || []); }
    catch (err) { console.error(err); }
  };

  const handleSemesterClick = async (sem) => {
    setSelectedSemester(sem);
    try { const res = await getTeacherSemesterCourses(sem.id); setCourses(res.data.courses || []); }
    catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedSemester) return alert('No semester selected');
    try {
      await createCourse({ ...newCourseData, semester_id: selectedSemester.id });
      setShowModal(false); setNewCourseData({ name: '', description: '' });
      handleSemesterClick(selectedSemester);
    } catch (err) { alert('Failed to create course'); }
  };

  return (
    <div className="dashboard-wrapper">
      {/* HERO HEADER */}
      <div className="dashboard-hero">
        <div className="hero-overlay" />
        <div className="hero-container">
          <AnnouncementBanner />
          <div className="hero-header-content">
            <div className="hero-text-area">
              {selectedSemester && (
                <button onClick={() => setSelectedSemester(null)} className="back-btn">
                  ← All Semesters
                </button>
              )}
              <h1>
                {selectedSemester ? selectedSemester.name : `Welcome, ${user?.username?.split(' ')[0]} 👋`}
              </h1>
              <p>
                {selectedSemester ? `${courses.length} active courses` : 'Select a semester to manage your curriculum'}
              </p>
            </div>
            {selectedSemester && (
              <button onClick={() => setShowModal(true)} className="create-course-btn">
                <span>+</span> Create Course
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="dashboard-content">
        {/* SEMESTER CARDS */}
        {!selectedSemester && (
          <div className="card-grid">
            {semesters.map((sem, i) => (
              <div key={sem.id} onClick={() => handleSemesterClick(sem)} className="semester-card">
                <div className="sem-icon" style={{ background: COURSE_BG[i % COURSE_BG.length], border: `1.5px solid ${COURSE_ACCENTS[i % COURSE_ACCENTS.length]}22` }}>📅</div>
                <h3>{sem.name}</h3>
                <p>Click to view courses</p>
                <div className="open-tag">Open →</div>
              </div>
            ))}
            {semesters.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No Active Semesters</h3>
                <p>Please contact an Administrator to activate a semester.</p>
              </div>
            )}
          </div>
        )}

        {/* COURSE CARDS */}
        {selectedSemester && (
          <div className="card-grid">
            {courses.length === 0 ? (
              <div className="empty-state dashed">
                <div className="empty-icon">📂</div>
                <h3>No courses yet</h3>
                <p>Create your first course to get started.</p>
                <button onClick={() => setShowModal(true)} className="btn-primary">Create Course</button>
              </div>
            ) : (
              courses.map((course, i) => {
                const accent = COURSE_ACCENTS[i % COURSE_ACCENTS.length];
                const bg = COURSE_BG[i % COURSE_BG.length];
                return (
                  <div key={course.id} className="course-card">
                    <div className="course-accent" style={{ background: accent }} />
                    <div className="course-body">
                      <div className="course-top">
                        <div className="course-icon" style={{ background: bg }}>📚</div>
                        {course.code && <span className="course-code-tag" style={{ background: bg, color: accent }}>{course.code}</span>}
                      </div>
                      <h3>{course.name}</h3>
                      <p>{course.description || 'No description provided.'}</p>
                      <div className="course-footer">
                        <span>👥 {course.student_count} Students</span>
                        <Link to={`/course/${course.id}`} className="manage-btn" style={{ background: accent }}>Manage →</Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* CREATE COURSE MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Create New Course</h2>
            <p>Adding to: <strong>{selectedSemester?.name}</strong></p>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Course Name</label>
                <input type="text" placeholder="e.g. Data Structures" value={newCourseData.name} onChange={e => setNewCourseData({ ...newCourseData, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea placeholder="Brief overview..." value={newCourseData.description} onChange={e => setNewCourseData({ ...newCourseData, description: e.target.value })} style={{ minHeight: '80px' }} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .dashboard-wrapper { background: #f8fafc; min-height: 100vh; }
        
        .dashboard-hero { 
          background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); 
          padding: 40px 0 100px 0; position: relative; overflow: hidden; 
        }
        .hero-overlay { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 28px 28px; }
        .hero-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; position: relative; }
        
        .hero-header-content { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 28px; gap: 20px; flex-wrap: wrap; }
        .hero-text-area h1 { color: white; font-size: clamp(1.6rem, 4vw, 2.2rem); font-weight: 900; margin: 0; letter-spacing: -0.5px; }
        .hero-text-area p { color: rgba(255,255,255,0.65); margin-top: 8px; font-size: 0.95rem; }
        
        .back-btn { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.2); padding: 6px 14px; borderRadius: 7px; cursor: pointer; font-size: 0.82rem; margin-bottom: 14px; }
        .create-course-btn { background: white; color: #1d4ed8; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 800; font-size: 0.9rem; box-shadow: 0 4px 20px rgba(0,0,0,0.2); cursor: pointer; }

        .dashboard-content { max-width: 1280px; margin: -48px auto 0; padding: 0 24px 60px; position: relative; z-index: 10; }
        
        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        
        .semester-card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 28px 24px; cursor: pointer; text-align: center; transition: 0.2s; }
        .semester-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .sem-icon { width: 60px; height: 60px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 18px; }
        .open-tag { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 5px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }

        .course-card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; transition: 0.2s; }
        .course-card:hover { transform: translateY(-4px); }
        .course-body { padding: 22px; flex: 1; display: flex; flex-direction: column; }
        .course-top { display: flex; justify-content: space-between; align-items: center; }
        .course-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
        .course-card h3 { margin: 15px 0 8px; font-size: 1.1rem; font-weight: 800; color: #0f172a; }
        .course-card p { color: #64748b; font-size: 0.9rem; flex: 1; margin-bottom: 20px; }
        .course-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #f1f5f9; }
        .manage-btn { color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.85rem; }

        .empty-state { grid-column: 1/-1; text-align: center; padding: 80px 20px; background: white; border-radius: 14px; border: 1px solid #e2e8f0; }
        .empty-state.dashed { border: 2px dashed #e2e8f0; }
        .empty-icon { font-size: 3rem; margin-bottom: 15px; opacity: 0.4; }

        .modal-card { background: white; padding: 32px; border-radius: 16px; width: 100%; max-width: 440px; }
        .modal-actions { display: flex; gap: 10px; margin-top: 20px; }

        @media (max-width: 768px) {
          .hero-header-content { flex-direction: column; align-items: center; text-align: center; }
          .create-course-btn { width: 100%; }
          .dashboard-hero { padding-bottom: 80px; }
          .dashboard-content { margin-top: -30px; }
        }
      `}</style>
    </div>
  );
};

export default TeacherDashboard;