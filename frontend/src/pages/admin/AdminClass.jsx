import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// ✅ IMPORT THE NEW FUNCTION
import { getAllCoursesAdmin, updateCourseSchedule, downloadScheduleCsv } from '../../services/api'; 

const AdminClass = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Toggle to show only clashes
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);
  
  // ✅ NEW: Download loading state
  const [downloading, setDownloading] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ day: '', time: '', room: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getAllCoursesAdmin();
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Handle Download Click
  const handleDownload = async () => {
    setDownloading(true);
    await downloadScheduleCsv();
    setDownloading(false);
  };

  // --- CLASH DETECTION LOGIC ---
  const checkClash = (course) => {
    const clash = courses.find(c => 
      c.id !== course.id && 
      c.day === course.day && 
      c.time === course.time && 
      c.room === course.room &&
      c.day && c.time && c.room 
    );
    return clash ? true : false;
  };

  const handleEditClick = (course) => {
    setEditingId(course.id);
    setEditForm({ 
        day: course.day || '', 
        time: course.time ? course.time.split(' - ')[0] : '', 
        room: course.room || '' 
    });
  };

  const handleSave = async (id) => {
    setSaving(true);
    try {
        await updateCourseSchedule(id, editForm);
        
        const updatedCourses = courses.map(c => 
            c.id === id ? { ...c, ...editForm } : c
        );
        setCourses(updatedCourses);
        setEditingId(null);
    } catch (err) {
        alert("Failed to save schedule.");
    } finally {
        setSaving(false);
    }
  };

  // --- FILTERING LOGIC ---
  const filteredCourses = courses.filter(c => {
    const matchesSearch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.course_catalog_code?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.room?.toLowerCase().includes(searchTerm.toLowerCase());

    if (showConflictsOnly) {
        return matchesSearch && checkClash(c);
    }
    return matchesSearch;
  });

  const conflictCount = courses.filter(c => checkClash(c)).length;

  return (
    <div style={{ background: 'var(--bg-body)', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* HEADER */}
      <div style={{ background: '#1e293b', color: 'white', padding: '40px 0 60px 0' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', marginBottom: '15px', cursor: 'pointer' }}>← Back</button>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'end' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>Class Schedule</h1>
                <p style={{ opacity: 0.8, marginTop: '5px', fontSize: '0.9rem' }}>Manage logistics and resolve {conflictCount} detected conflicts.</p>
              </div>
              
              {/* BUTTON GROUP */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  
                  {/* ✅ DOWNLOAD CSV BUTTON */}
                  <button 
                    onClick={handleDownload}
                    disabled={downloading}
                    style={{
                        background: '#10b981', // Green
                        color: 'white', border: 'none',
                        padding: '10px 20px', borderRadius: '30px', cursor: 'pointer',
                        fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                        transition: 'all 0.2s', fontSize: '0.9rem',
                        opacity: downloading ? 0.7 : 1
                    }}
                  >
                    {downloading ? 'Exporting...' : '📥 Export CSV'}
                  </button>

                  {/* Conflict Toggle Button */}
                  <button 
                    onClick={() => setShowConflictsOnly(!showConflictsOnly)}
                    style={{
                        background: showConflictsOnly ? '#ef4444' : 'rgba(255,255,255,0.1)',
                        color: 'white', border: showConflictsOnly ? 'none' : '1px solid rgba(255,255,255,0.3)',
                        padding: '10px 20px', borderRadius: '30px', cursor: 'pointer',
                        fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap', 
                        fontSize: '0.9rem'
                    }}
                  >
                    {showConflictsOnly ? 'Show All Classes' : `⚠️ Show ${conflictCount} Conflicts Only`}
                  </button>
              </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1200px', margin: '-40px auto 0', padding: '0 20px' }}>
        
        {/* Search Bar */}
        <div style={{ marginBottom: '20px' }}>
            <input 
                type="text" 
                placeholder="🔍 Search class, code, teacher, or room..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
            />
        </div>

        {/* Responsive Table Wrapper */}
        <div className="card" style={{ 
            background: 'white', 
            borderRadius: '12px', 
            overflow: 'hidden', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            overflowX: 'auto' 
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <tr>
                        <th style={{ padding: '15px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>COURSE</th>
                        <th style={{ padding: '15px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>INSTRUCTOR</th>
                        <th style={{ padding: '15px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>DAY</th>
                        <th style={{ padding: '15px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>TIME</th>
                        <th style={{ padding: '15px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>ROOM</th>
                        <th style={{ padding: '15px', textAlign: 'right', color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredCourses.length === 0 ? (
                        <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No classes found.</td></tr>
                    ) : filteredCourses.map(course => {
                        const isClash = checkClash(course); 
                        const isEditing = editingId === course.id;

                        return (
                            <tr key={course.id} style={{ borderBottom: '1px solid #f1f5f9', background: isClash ? '#fef2f2' : 'white' }}>
                                <td style={{ padding: '15px', fontWeight: '600', color: '#1e293b' }}>
                                    {course.name}
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                        {course.course_catalog_code && <span style={{ fontWeight: 'bold', color: '#334155' }}>{course.course_catalog_code}</span>}
                                        {course.course_catalog_code && <span style={{ margin: '0 6px', color: '#cbd5e1' }}>|</span>}
                                        <span>{course.class_code}</span>
                                    </div>
                                    {isClash && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginTop: '4px', whiteSpace: 'nowrap' }}>⚠️ CONFLICT</span>}
                                </td>
                                <td style={{ padding: '15px', color: '#475569' }}>{course.teacher_name}</td>
                                
                                {/* Day Column */}
                                <td style={{ padding: '15px' }}>
                                    {isEditing ? (
                                        <select 
                                            value={editForm.day} 
                                            onChange={e => setEditForm({...editForm, day: e.target.value})}
                                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%' }}
                                        >
                                            <option value="">Select...</option>
                                            <option value="Monday">Monday</option>
                                            <option value="Tuesday">Tuesday</option>
                                            <option value="Wednesday">Wednesday</option>
                                            <option value="Thursday">Thursday</option>
                                            <option value="Friday">Friday</option>
                                            <option value="Saturday">Saturday</option>
                                        </select>
                                    ) : (
                                        <span style={{ padding: '4px 8px', background: course.day ? '#f1f5f9' : '#fff1f2', color: course.day ? 'inherit' : '#ef4444', borderRadius: '4px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                            {course.day || 'Not Set'}
                                        </span>
                                    )}
                                </td>

                                {/* Time Column */}
                                <td style={{ padding: '15px' }}>
                                    {isEditing ? (
                                        <input 
                                            type="time" 
                                            value={editForm.time} 
                                            onChange={e => setEditForm({...editForm, time: e.target.value})}
                                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%' }}
                                        />
                                    ) : (
                                        <span style={{ padding: '4px 8px', background: course.time ? '#f1f5f9' : '#fff1f2', color: course.time ? 'inherit' : '#ef4444', borderRadius: '4px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                            {course.time || 'Not Set'}
                                        </span>
                                    )}
                                </td>

                                {/* Room Column */}
                                <td style={{ padding: '15px' }}>
                                    {isEditing ? (
                                        <input 
                                            type="text" 
                                            value={editForm.room} 
                                            onChange={e => setEditForm({...editForm, room: e.target.value})}
                                            placeholder="Room"
                                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '80px' }}
                                        />
                                    ) : (
                                        <span style={{ padding: '4px 8px', background: isClash ? '#fee2e2' : (course.room ? '#f0fdf4' : '#fff1f2'), color: isClash ? '#991b1b' : (course.room ? '#166534' : '#ef4444'), borderRadius: '4px', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                            {course.room || 'No Room'}
                                        </span>
                                    )}
                                </td>

                                <td style={{ padding: '15px', textAlign: 'right' }}>
                                    {isEditing ? (
                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleSave(course.id)} disabled={saving} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                                                {saving ? '...' : 'Save'}
                                            </button>
                                            <button onClick={() => setEditingId(null)} style={{ background: '#94a3b8', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => handleEditClick(course)} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>

      </div>
    </div>
  );
};

export default AdminClass;