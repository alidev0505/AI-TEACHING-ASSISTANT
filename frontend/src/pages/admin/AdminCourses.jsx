import React, { useState, useEffect } from 'react';
import { getAllCoursesAdmin, adminUnlockAttendance, downloadAttendanceFile } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const AdminCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 🔹 SEARCH STATE
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await getAllCoursesAdmin();
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error("Error loading courses:", err);
      setError("Failed to load course registry.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (id, courseName) => {
    if(!window.confirm(`Unlock attendance for "${courseName}"?\n\nThe teacher will be able to modify the attendance sheet again.`)) return;
    
    try {
      await adminUnlockAttendance(id);
      alert("Attendance Unlocked Successfully.");
      loadCourses(); // Refresh list
    } catch (err) { 
      alert("Error unlocking attendance"); 
    }
  };

  const handleDownload = (id) => {
    downloadAttendanceFile(id);
  };

  // 🔹 SEARCH FILTER LOGIC
  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.class_code.includes(searchTerm) ||
    (c.course_catalog_code && c.course_catalog_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.program && c.program.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ background: 'var(--bg-body)', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* 1. ADMIN HEADER */}
      <div style={{ background: '#1e293b', color: 'white', padding: '40px 0 60px 0' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', 
              padding: '8px 16px', borderRadius: '6px', marginBottom: '15px', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '5px'
            }}
          >
            ← Back
          </button>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', color: 'white' }}>Attendance Management</h1>
          <p style={{ opacity: 0.8, marginTop: '10px', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Review finalized sheets and download reports.</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1200px', margin: '-40px auto 0', padding: '0 20px' }}>
        
        {/* ✅ SEARCH BAR */}
        <div style={{ marginBottom: '20px' }}>
             <input 
                type="text" 
                placeholder="🔍 Search course, code, teacher..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                    width: '100%', padding: '15px 20px', borderRadius: '12px',
                    border: '1px solid #cbd5e1', fontSize: '1rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)', outline: 'none'
                }}
            />
        </div>

        {/* 2. MAIN CARD */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', background: 'white', borderTop: '5px solid #8b5cf6', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            
            {/* Header Section */}
            <div style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>Course Registry</h3>
                <span style={{ background: '#e2e8f0', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
                    Showing: {filteredCourses.length}
                </span>
            </div>

            {loading ? (
                <div style={{ padding: '50px', textAlign: 'center' }}>Loading records...</div>
            ) : error ? (
                <div style={{ padding: '30px', color: '#ef4444', textAlign: 'center' }}>{error}</div>
            ) : filteredCourses.length === 0 ? (
                <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {courses.length === 0 ? "No attendance records found." : "No courses match your search."}
                </div>
            ) : (
                <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '15px 25px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Course Details</th>
                                <th style={{ padding: '15px 25px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Teacher</th>
                                <th style={{ padding: '15px 25px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Attendance Status</th>
                                <th style={{ padding: '15px 25px', textAlign: 'right', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCourses.map(course => (
                                <tr key={course.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    
                                    {/* 1. Course Name & Badges */}
                                    <td style={{ padding: '15px 25px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                            <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '1rem' }}>{course.name}</div>
                                            {/* Institute Code Badge */}
                                            {course.course_catalog_code && (
                                                <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                    {course.course_catalog_code}
                                                </span>
                                            )}
                                        </div>

                                        {/* Metadata Badges */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                                            {course.program && <span style={{ fontSize: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '2px 6px', borderRadius: '4px' }}>🎓 {course.program}</span>}
                                            {course.semester_code && <span style={{ fontSize: '0.75rem', background: '#f0fdf4', border: '1px solid #dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px' }}>🗓️ {course.semester_code}</span>}
                                            {course.shift && <span style={{ fontSize: '0.75rem', background: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px' }}>⏰ {course.shift}</span>}
                                        </div>

                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                            Code: <strong>{course.class_code}</strong>
                                        </div>
                                    </td>

                                    {/* 2. Teacher & Email */}
                                    <td style={{ padding: '15px 25px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                {course.teacher_name ? course.teacher_name.charAt(0).toUpperCase() : 'T'}
                                            </div>
                                            <div>
                                                <div style={{ color: '#334155', fontWeight: '500' }}>{course.teacher_name}</div>
                                                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{course.teacher_email}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 3. Status Badge */}
                                    <td style={{ padding: '15px 25px', textAlign: 'center' }}>
                                        {course.is_attendance_locked ? (
                                            <span style={{ background: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                                                Finalized
                                            </span>
                                        ) : (
                                            <span style={{ background: '#f1f5f9', color: '#64748b', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                                                Active
                                            </span>
                                        )}
                                    </td>

                                    {/* 4. Actions */}
                                    <td style={{ padding: '15px 25px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'nowrap' }}>
                                            {course.is_attendance_locked ? (
                                                <>
                                                    <button 
                                                        onClick={() => handleUnlock(course.id, course.name)}
                                                        title="Unlock Sheet"
                                                        style={{ 
                                                            background: '#fffbeb', color: '#b45309', border: '1px solid #fcd34d', 
                                                            padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        Unlock
                                                    </button>

                                                    <button 
                                                        onClick={() => handleDownload(course.id)}
                                                        title="Download Excel Report"
                                                        style={{ 
                                                            background: '#10b981', color: 'white', border: 'none', 
                                                            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                                                            display: 'flex', alignItems: 'center', gap: '5px'
                                                        }}
                                                    >
                                                        CSV
                                                    </button>
                                                </>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', padding: '8px 0' }}>
                                                    --
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default AdminCourses;