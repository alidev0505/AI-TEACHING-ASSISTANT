import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCoursesAdmin } from '../../services/api';

const AdminDepartments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [allCourses, setAllCourses] = useState([]); 
  const [stats, setStats] = useState({}); 
  
  // Modal States
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [modalSearch, setModalSearch] = useState('');

  // 1. DEFINE DEPARTMENTS (Removed Icons/Emojis)
  const departments = [
    { id: 'BSCS', name: 'Computer Science', color: '#3b82f6' },
    { id: 'BSSE', name: 'Software Engineering', color: '#10b981' },
    { id: 'BSAI', name: 'Artificial Intelligence', color: '#8b5cf6' },
    { id: 'BSCYBER', name: 'Cyber Security', color: '#ef4444' },
    { id: 'BSIT', name: 'Information Technology', color: '#f59e0b' },
    { id: 'BBS', name: 'Business Administration', color: '#0ea5e9' },
    { id: 'BSAF', name: 'Accounting & Finance', color: '#ec4899' },
    { id: 'OTHER', name: 'General / Other', color: '#64748b' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getAllCoursesAdmin();
      const courses = res.data.courses || [];
      setAllCourses(courses);
      
      const newStats = {};

      courses.forEach(c => {
        let prog = c.program ? c.program.toUpperCase().trim() : 'OTHER';
        const knownIds = departments.map(d => d.id);
        if (!knownIds.includes(prog)) prog = 'OTHER';

        if (!newStats[prog]) {
            newStats[prog] = { courses: 0, teachers: new Set(), students: 0 };
        }
        
        newStats[prog].courses += 1;
        newStats[prog].students += (c.student_count || 0); 
        
        if (c.teacher_name) newStats[prog].teachers.add(c.teacher_name);
      });

      setStats(newStats);
    } catch (err) {
      console.error("Failed to calculate department stats", err);
    } finally {
      setLoading(false);
    }
  };

  const getDeptDetails = (deptId) => {
    const deptCourses = allCourses.filter(c => {
        const prog = c.program ? c.program.toUpperCase().trim() : 'OTHER';
        return deptId === 'OTHER' ? !departments.map(d=>d.id).includes(prog) : prog === deptId;
    });

    const teachers = [...new Set(deptCourses.map(c => c.teacher_name).filter(Boolean))].sort();
    return { courses: deptCourses, teachers };
  };

  const closeModal = () => {
      setSelectedDept(null);
      setSelectedTeacher(null); 
      setModalSearch(''); 
  };

  return (
    <div style={{ background: 'var(--bg-body)', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* HEADER */}
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
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', color: 'white' }}>Academic Departments</h1>
          <p style={{ opacity: 0.8, marginTop: '10px' }}>Select a department to view courses, faculty, and student enrollment.</p>
        </div>
      </div>

      {/* DEPARTMENT GRID */}
      <div className="container" style={{ maxWidth: '1200px', margin: '-40px auto 0', padding: '0 20px' }}>
        {loading ? (
             <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '12px' }}>Loading...</div>
        ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                {departments.map((dept) => {
                    const deptStats = stats[dept.id] || { courses: 0, teachers: new Set(), students: 0 };
                    return (
                        <div 
                            key={dept.id} 
                            onClick={() => setSelectedDept(dept)} 
                            style={{ 
                                background: 'white', borderRadius: '12px', overflow: 'hidden',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderTop: `5px solid ${dept.color}`,
                                cursor: 'pointer', transition: 'transform 0.2s', padding: '25px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                {/* Replaced Icon with Department ID Code */}
                                <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: dept.color, background: `${dept.color}15`, padding: '5px 12px', borderRadius: '8px' }}>
                                    {dept.id}
                                </span>
                                <span style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#334155' }}>
                                    {deptStats.courses}
                                </span>
                            </div>
                            <h3 style={{ margin: 0, color: '#1e293b' }}>{dept.name}</h3>
                            <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Department of {dept.id}</p>

                            {/* STATS GRID */}
                            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#334155' }}>{deptStats.courses}</div>
                                    <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase' }}>Courses</div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#334155' }}>{deptStats.teachers.size}</div>
                                    <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase' }}>Faculty</div>
                                </div>
                                <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#166534' }}>{deptStats.students}</div>
                                    <div style={{ fontSize: '0.6rem', color: '#166534', textTransform: 'uppercase' }}>Students</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {selectedDept && (
          <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
              animation: 'fadeIn 0.2s'
          }}>
              <div style={{ 
                  background: '#f8fafc', width: '95%', maxWidth: '1000px', height: '85vh', 
                  borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}>
                  
                  {/* 1. Header */}
                  <div style={{ padding: '20px 30px', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
                                  {selectedDept.name}
                              </h2>
                              <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                                  Code: <strong style={{ color: selectedDept.color }}>{selectedDept.id}</strong>
                              </p>
                          </div>
                          <button onClick={closeModal} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>

                      {/* SEARCH BAR */}
                      <div style={{ marginTop: '15px' }}>
                          <input 
                              type="text" 
                              placeholder="Search for courses or codes..." 
                              value={modalSearch}
                              onChange={(e) => setModalSearch(e.target.value)}
                              style={{
                                  width: '100%', padding: '10px 15px', borderRadius: '8px',
                                  border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', background: '#f8fafc'
                              }}
                          />
                      </div>
                  </div>

                  {(() => {
                      const details = getDeptDetails(selectedDept.id);
                      
                      // 1. Filter by Teacher
                      let displayedCourses = selectedTeacher 
                          ? details.courses.filter(c => c.teacher_name === selectedTeacher)
                          : details.courses;

                      // 2. Filter by Search
                      if (modalSearch) {
                          displayedCourses = displayedCourses.filter(c => 
                              c.name.toLowerCase().includes(modalSearch.toLowerCase()) || 
                              c.class_code.includes(modalSearch)
                          );
                      }

                      return (
                          <>
                              {/* 2. Horizontal Filter Bar */}
                              <div style={{ padding: '15px 30px', background: 'white', borderBottom: '1px solid #e2e8f0', overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex', gap: '10px' }}>
                                  <button
                                      onClick={() => setSelectedTeacher(null)}
                                      style={{
                                          padding: '8px 16px', borderRadius: '20px', border: 'none', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '500',
                                          background: selectedTeacher === null ? '#1e293b' : '#f1f5f9',
                                          color: selectedTeacher === null ? 'white' : '#64748b',
                                          transition: 'all 0.2s'
                                      }}
                                  >
                                      All Faculty
                                  </button>

                                  {details.teachers.map((t) => (
                                      <button
                                          key={t}
                                          onClick={() => setSelectedTeacher(t === selectedTeacher ? null : t)}
                                          style={{
                                              padding: '8px 16px', borderRadius: '20px', border: '1px solid', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '500',
                                              background: selectedTeacher === t ? `${selectedDept.color}15` : 'white',
                                              borderColor: selectedTeacher === t ? selectedDept.color : '#e2e8f0',
                                              color: selectedTeacher === t ? selectedDept.color : '#64748b',
                                              transition: 'all 0.2s'
                                          }}
                                      >
                                          {t}
                                      </button>
                                  ))}
                              </div>

                              {/* 3. Course Grid Content */}
                              <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                      <h3 style={{ margin: 0, color: '#334155' }}>
                                          {selectedTeacher ? `Courses by ${selectedTeacher}` : `All Active Courses`}
                                      </h3>
                                      <span style={{ background: '#e2e8f0', padding: '4px 10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>
                                          {displayedCourses.length} Found
                                      </span>
                                  </div>

                                  {displayedCourses.length === 0 ? (
                                      <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                          {modalSearch ? `No results for "${modalSearch}"` : "No courses found."}
                                      </div>
                                  ) : (
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                          {displayedCourses.map(c => (
                                              <div key={c.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                  
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                      <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b', lineHeight: '1.4' }}>{c.name}</h4>
                                                      {c.course_catalog_code && <span style={{ fontSize: '0.7rem', background: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{c.course_catalog_code}</span>}
                                                  </div>

                                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                      <span style={{ fontSize: '0.75rem', background: '#f0fdf4', color: '#166534', padding: '3px 8px', borderRadius: '4px' }}>{c.semester_code}</span>
                                                      <span style={{ fontSize: '0.75rem', background: '#fffbeb', color: '#b45309', padding: '3px 8px', borderRadius: '4px' }}>{c.shift}</span>
                                                      {c.room && <span style={{ fontSize: '0.75rem', background: '#f3e8ff', color: '#6b21a8', padding: '3px 8px', borderRadius: '4px' }}>📍 {c.room}</span>}
                                                  </div>

                                                  <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                          {c.teacher_name ? c.teacher_name.charAt(0) : '?'}
                                                      </div>
                                                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{c.teacher_name}</span>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </>
                      );
                  })()}
              </div>
          </div>
      )}

    </div>
  );
};

export default AdminDepartments;