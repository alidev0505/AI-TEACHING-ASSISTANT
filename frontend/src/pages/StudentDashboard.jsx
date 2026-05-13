import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getActiveSemesters, getStudentSemesterCourses, enrollInCourse, getStudentAnalytics, searchCourseByCode } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import AnnouncementBanner from '../components/AnnouncementBanner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COURSE_ACCENTS = ['#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [foundCourse, setFoundCourse] = useState(null);
  const [error, setError] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [pendingQuizzes, setPendingQuizzes] = useState([]);

  useEffect(() => { 
    fetchSemesters(); 
    fetchStats(); 
  }, []);

  const fetchSemesters = async () => {
    try { 
      const res = await getActiveSemesters(); 
      setSemesters(res.data.semesters || []); 
    } catch (err) { 
      console.error("Semester fetch failed:", err); 
    }
  };

  const fetchPendingQuizzes = async (courseIds) => {
    if (!courseIds || courseIds.length === 0) return; // Guard clause
    const token = localStorage.getItem('token');
    try {
      const quizPromises = courseIds.map(id =>
        fetch(`https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net/api/quiz/student/available-quizzes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.ok ? res.json() : [])
      );
      const results = await Promise.all(quizPromises);
      setPendingQuizzes(results.flat());
    } catch (err) { 
      console.error("Error fetching quizzes:", err); 
    }
  };

  const handleSemesterClick = async (sem) => {
    if (!sem || !sem.id) return; // Guard clause to prevent Network Errors
    setSelectedSemester(sem);
    try {
      const res = await getStudentSemesterCourses(sem.id);
      const coursesData = res.data.courses || [];
      setCourses(coursesData);
      fetchPendingQuizzes(coursesData.map(c => c.id));
    } catch (err) { 
      console.error("Course fetch failed:", err); 
      // If network fails, reset courses to prevent showing old data
      setCourses([]);
    }
  };

  const fetchStats = async () => {
    try { 
      const res = await getStudentAnalytics(); 
      setAnalytics(res.data); 
    } catch (err) { 
      console.error("Stats fetch failed:", err); 
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault(); 
    setError(''); 
    setFoundCourse(null);
    if (searchCode.length < 4) return setError('Code must be at least 4 characters');
    try { 
      const res = await searchCourseByCode(searchCode); 
      setFoundCourse(res.data.course); 
    } catch { 
      setError('Invalid class code. Please try again.'); 
    }
  };

  const handleEnroll = async () => {
    setEnrollLoading(true);
    try {
      await enrollInCourse(searchCode);
      setFoundCourse(null); 
      setSearchCode(''); 
      setShowEnrollModal(false);
      // Trigger refresh
      if (selectedSemester) handleSemesterClick(selectedSemester);
      fetchStats();
      alert('Enrolled successfully!');
    } catch (err) { 
      alert(err.response?.data?.error || 'Enrollment failed.'); 
    } finally { 
      setEnrollLoading(false); 
    }
  };

  const getSemesterChartData = () => {
    if (!analytics || !analytics.charts || !courses.length) return [];
    const names = courses.map(c => c.name);
    return analytics.charts.filter(d => names.includes(d.name));
  };

  return (
    <div className="std-dashboard">
      {/* HERO HEADER */}
      <div className="std-hero">
        <div className="hero-grid-overlay" />
        <div className="hero-container">
          <AnnouncementBanner />
          <div className="hero-flex-header">
            <div className="hero-title-block">
              {selectedSemester && (
                <button onClick={() => setSelectedSemester(null)} className="back-link">
                  ← All Semesters
                </button>
              )}
              <h1>{selectedSemester ? selectedSemester.name : `Hello, ${user?.username?.split(' ')[0]} 👋`}</h1>
              <p>{selectedSemester ? `${courses.length} enrolled courses` : 'Select a semester to view your academic progress'}</p>
            </div>
            {selectedSemester && (
              <button onClick={() => setShowEnrollModal(true)} className="enroll-btn">
                <span>+</span> Join Class
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="std-content">
        {!selectedSemester ? (
          <div className="semester-grid">
            {semesters.map((sem) => (
              <div key={sem.id} onClick={() => handleSemesterClick(sem)} className="sem-card">
                <div className="sem-emoji">📚</div>
                <h3>{sem.name}</h3>
                <p>Click to view courses</p>
                <span className="open-pill">Open →</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="semester-view-wrapper">
            {/* STATS ROW */}
            <div className="stats-row">
              {[
                { label: 'Enrolled Courses', value: courses.length, icon: '📚', color: '#2563eb', bg: '#eff6ff' },
                { label: 'Assignments Done', value: analytics?.total_completed || 0, icon: '✅', color: '#059669', bg: '#f0fdf4' },
                { label: 'Pending Tasks', value: analytics?.total_pending || 0, icon: '⏳', color: '#d97706', bg: '#fffbeb' },
                { label: 'Avg. Attendance', value: `${analytics?.avg_attendance || 0}%`, icon: '📅', color: '#7c3aed', bg: '#f5f3ff' },
              ].map(stat => (
                <div key={stat.label} className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon" style={{ background: stat.bg }}>{stat.icon}</div>
                    <span>{stat.label}</span>
                  </div>
                  <div className="stat-val" style={{ color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* ACTIVE ASSESSMENTS */}
            {pendingQuizzes.length > 0 && (
              <div className="assessments-section">
                <h3 className="sub-heading red">Active Assessments 🚀</h3>
                <div className="assessment-grid">
                  {pendingQuizzes.map(quiz => (
                    <div key={quiz.id} className="quiz-card">
                      <div className="quiz-info">
                        <span className="quiz-tag">New Quiz Assigned</span>
                        <h4>{quiz.title}</h4>
                        <div className="quiz-meta">
                          <span>⏱️ {quiz.time_limit}m</span>
                          {quiz.deadline && <span className="deadline">⌛ Due: {new Date(quiz.deadline).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <button onClick={() => navigate(`/take-quiz/${quiz.id}`)} className="start-quiz-btn">Start →</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PERFORMANCE & ATTENDANCE */}
            <div className="visual-row">
              <div className="chart-container">
                <h3>Semester Performance</h3>
                <p>Assignment completion per course</p>
                <div className="chart-box">
                  {getSemesterChartData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={getSemesterChartData()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        <Bar dataKey="completed" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pending" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="no-data">📊 No data yet</div>}
                </div>
              </div>

              <div onClick={() => navigate('/student/attendance')} className="attendance-promo">
                <div className="promo-icon">📅</div>
                <h3>My Attendance</h3>
                <p>View detailed report</p>
              </div>
            </div>

            {/* COURSE LIST */}
            <h3 className="sub-heading blue">Enrolled Courses</h3>
            <div className="course-grid">
              {courses.length === 0 ? (
                <div className="empty-courses">
                   <p>You're not enrolled in any courses for this semester.</p>
                   <button onClick={() => setShowEnrollModal(true)} className="btn-primary">Join a Class</button>
                </div>
              ) : (
                courses.map((course, i) => (
                  <div key={course.id} className="std-course-card">
                    <div className="card-top-bar" style={{ background: COURSE_ACCENTS[i % 6] }} />
                    <div className="card-content">
                      <div className="card-header-flex">
                        <h4>{course.name}</h4>
                        <span className="course-code">{course.code || course.class_code}</span>
                      </div>
                      <p className="teacher-name">👤 {course.teacher || course.teacher_name}</p>
                      <Link to={`/course/${course.id}`} className="enter-btn">Enter Classroom →</Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ENROLL MODAL */}
      {showEnrollModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Join a Class</h2>
            <p>Enter the class code provided by your teacher.</p>
            <form onSubmit={handleSearch}>
              <div className="search-row">
                <input placeholder="e.g. A7X2" value={searchCode} onChange={e => setSearchCode(e.target.value.toUpperCase())} className="code-input" />
                <button type="submit" className="search-btn">Search</button>
              </div>
            </form>
            {error && <div className="error-msg">⚠ {error}</div>}
            {foundCourse && (
              <div className="found-box">
                <div className="found-name">{foundCourse.name}</div>
                <div className="found-teacher">Teacher: {foundCourse.teacher_name}</div>
                <button onClick={handleEnroll} disabled={enrollLoading} className="confirm-btn">
                  {enrollLoading ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            )}
            <button onClick={() => { setShowEnrollModal(false); setFoundCourse(null); setSearchCode(''); setError(''); }} className="cancel-btn">Cancel</button>
          </div>
        </div>
      )}

      <style>{`
        .std-dashboard { background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .std-hero { background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); padding: 40px 0 100px; position: relative; overflow: hidden; }
        .hero-grid-overlay { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 28px 28px; }
        .hero-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; position: relative; }
        .hero-flex-header { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 28px; flex-wrap: wrap; gap: 20px; }
        .hero-title-block h1 { color: white; font-size: clamp(1.6rem, 4vw, 2.2rem); font-weight: 900; margin: 0; letter-spacing: -0.5px; }
        .hero-title-block p { color: rgba(255,255,255,0.65); margin: 8px 0 0; font-size: 0.95rem; }
        .back-link { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 7px; cursor: pointer; font-size: 0.8rem; margin-bottom: 12px; }
        .enroll-btn { background: white; color: #1d4ed8; padding: 12px 24px; border-radius: 10px; font-weight: 800; border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }

        .std-content { max-width: 1280px; margin: -48px auto 0; padding: 0 24px 60px; position: relative; z-index: 10; }
        
        .semester-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
        .sem-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px 20px; cursor: pointer; text-align: center; transition: 0.3s; }
        .sem-card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(0,0,0,0.05); }
        .sem-emoji { font-size: 2.5rem; margin-bottom: 15px; }
        .open-pill { background: #eff6ff; color: #1d4ed8; padding: 5px 15px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }

        .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 30px; }
        .stat-card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; }
        .stat-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; color: #64748b; font-size: 0.8rem; font-weight: 600; }
        .stat-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
        .stat-val { font-size: 1.8rem; font-weight: 900; }

        .visual-row { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
        .chart-container { flex: 2 1 400px; background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; }
        .attendance-promo { flex: 1 1 250px; background: linear-gradient(135deg, #1d4ed8, #0284c7); border-radius: 16px; padding: 30px; color: white; text-align: center; cursor: pointer; transition: 0.3s; }
        .attendance-promo:hover { transform: translateY(-4px); }
        .promo-icon { font-size: 2.5rem; margin-bottom: 10px; }

        .assessment-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-bottom: 30px; }
        .quiz-card { background: white; border: 1px solid #fee2e2; border-radius: 14px; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
        .quiz-tag { color: #ef4444; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
        .quiz-meta { display: flex; gap: 15px; font-size: 0.8rem; color: #64748b; margin-top: 5px; }
        .start-quiz-btn { background: #ef4444; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; }

        .course-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .std-course-card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; transition: 0.3s; }
        .card-top-bar { height: 4px; }
        .card-content { padding: 20px; }
        .card-header-flex { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .course-code { background: #f1f5f9; padding: 3px 8px; border-radius: 5px; font-size: 0.7rem; font-weight: 800; color: #475569; }
        .enter-btn { display: block; text-align: center; background: #1d4ed8; color: white; text-decoration: none; padding: 10px; border-radius: 8px; font-weight: 700; margin-top: 15px; }

        .sub-heading { font-size: 1rem; font-weight: 800; margin: 0 0 20px; padding-left: 12px; border-left: 4px solid #ddd; }
        .sub-heading.red { border-color: #ef4444; }
        .sub-heading.blue { border-color: #2563eb; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { background: white; padding: 30px; border-radius: 16px; width: 100%; max-width: 420px; text-align: center; }
        .search-row { display: flex; gap: 10px; margin: 20px 0; }
        .code-input { flex: 1; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 700; text-align: center; }
        .search-btn { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 0 20px; border-radius: 8px; font-weight: 700; cursor: pointer; }
        .cancel-btn { width: 100%; padding: 10px; background: none; border: 1px solid #e2e8f0; border-radius: 8px; color: #64748b; margin-top: 10px; cursor: pointer; }

        @media (max-width: 768px) {
          .hero-flex-header { flex-direction: column; align-items: center; text-align: center; }
          .enroll-btn { width: 100%; }
          .std-hero { padding-bottom: 80px; }
          .std-content { margin-top: -30px; }
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;