import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, updateUserRole, deleteUser, getAdminCourses, deleteCourse } from '../../services/api';
import AdminBatchUpload from './AdminBatchUpload'; 

const AdminUsers = () => {
  const navigate = useNavigate();

  // 🔹 DATA STATES
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 UI STATES
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'courses'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 🔹 SEARCH STATES
  const [userSearch, setUserSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');

  /* ===================== DATA FETCHING ===================== */
  const loadAllData = async () => {
    setLoading(true);
    try {
      // ✅ FIXED 1: Run requests cleanly. Separating axios calls eliminates promise formatting mismatch errors
      const userRes = await getUsers();
      setUsers(userRes.data.users || []);
      
      // Load courses down the line seamlessly
      await fetchCoursesData();
    } catch (err) {
      console.error("Data load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const fetchCoursesData = async () => {
    try {
        const res = await getAdminCourses();
        setCourses(res.data.courses || []);
    } catch (err) { 
        console.error("Course load failed:", err); 
    }
  };

  /* ===================== FILTER & PAGINATION LOGIC ===================== */
  
  // 1. Filter Users
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  // 2. Filter Courses
  const filteredCourses = courses.filter(c => 
    (c.name && c.name.toLowerCase().includes(courseSearch.toLowerCase())) ||
    (c.teacher_name && c.teacher_name.toLowerCase().includes(courseSearch.toLowerCase())) ||
    (c.class_code && c.class_code.includes(courseSearch)) ||
    (c.course_catalog_code && c.course_catalog_code.toLowerCase().includes(courseSearch.toLowerCase()))
  );

  // 3. Pagination Logic
  const dataToPaginate = activeTab === 'users' ? filteredUsers : filteredCourses;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataToPaginate.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(dataToPaginate.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  /* ===================== HANDLERS ===================== */
  const handleRoleChange = async (id, newRole) => {
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    try {
        await updateUserRole(id, { role: newRole });
    } catch (err) { alert("Failed to update role"); }
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return;
    try {
        await deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
    } catch (err) { alert("Failed to delete user"); }
  };

  const handleDeleteCourse = async (courseId, courseName) => {
    if (!window.confirm(`DELETE COURSE: "${courseName}"?\n\nThis will delete ALL quizzes, assignments, and grades associated with it.`)) return;
    try {
      const res = await deleteCourse(courseId); 
      if (res.status === 200 || res.status === 204) {
        setCourses(courses.filter(c => c.id !== courseId));
        // Reset to page 1 if current page becomes empty after deletion
        if (currentItems.length === 1 && currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
      } else { 
        alert("Failed to delete course"); 
      }
    } catch (err) { 
      console.error(err); 
    }
  };

  const getRoleStyle = (role) => {
    switch(role) {
        case 'admin': return { border: '1px solid #fecaca', color: '#b91c1c', background: '#fee2e2' };
        case 'teacher': return { border: '1px solid #c7d2fe', color: '#4338ca', background: '#e0e7ff' };
        default: return { border: '1px solid #e2e8f0', color: '#475569', background: '#f8fafc' };
    }
  };

  return (
    <div style={{ background: 'var(--bg-body)', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* 1. ADMIN HEADER */}
      <div style={{ background: '#1e293b', color: 'white', padding: '40px 0 80px 0' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h1 style={{ margin: 0, fontSize: '2rem', color: 'white' }}>System Administration</h1>
                <p style={{ opacity: 0.8, marginTop: '10px' }}>Manage user permissions, schedules, and course content.</p>
            </div>
            <button 
                onClick={() => navigate(-1)} 
                className="btn-secondary"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}
            >
                ← Exit Admin
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1200px', margin: '-50px auto 0', padding: '0 20px' }}>
        
        {/* 2. STATS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <StatCard title="Total Users" value={users.length} icon="👥" color="#3b82f6" />
            <StatCard title="Teachers" value={users.filter(u => u.role === 'teacher').length} icon="👨‍🏫" color="#8b5cf6" />
            <StatCard title="Total Courses" value={courses.length} icon="📚" color="#10b981" />
        </div>

        {/* 3. BATCH UPLOAD SECTION */}
        <AdminBatchUpload onUploadSuccess={loadAllData} />
        
        {/* 4. MAIN MANAGEMENT CARD */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', background: 'white', borderRadius: '12px', marginTop: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            
            {/* TABS HEADER */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <TabButton 
                    active={activeTab === 'users'} 
                    onClick={() => { setActiveTab('users'); setCurrentPage(1); }} // ✅ FIXED 2: Reset page indexing on layout swap
                    label="User Management" 
                />
                <TabButton 
                    active={activeTab === 'courses'} 
                    onClick={() => { setActiveTab('courses'); setCurrentPage(1); }} // ✅ FIXED 2: Reset page indexing on layout swap
                    label="Course Catalog" 
                />
            </div>

            {/* TOOLBAR (Search & Count) */}
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ margin: 0, fontWeight: '600', color: '#64748b' }}>
                    Showing {dataToPaginate.length === 0 ? 0 : indexOfFirstItem + 1}-{Math.min(indexOfLastItem, dataToPaginate.length)} of {dataToPaginate.length} records
                </p>
                <input 
                    type="text" 
                    placeholder={activeTab === 'users' ? "Search users..." : "Search courses..."}
                    value={activeTab === 'users' ? userSearch : courseSearch}
                    onChange={(e) => {
                        activeTab === 'users' ? setUserSearch(e.target.value) : setCourseSearch(e.target.value);
                        setCurrentPage(1); // Reset page on search
                    }}
                    style={{ padding: '10px 15px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '250px' }}
                />
            </div>

            {/* TABLE CONTENT */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                    <thead style={{ background: '#fff', borderBottom: '2px solid #f1f5f9' }}>
                        <tr>
                            {activeTab === 'users' ? (
                                <>
                                    <th style={thStyle}>User Profile</th>
                                    <th style={thStyle}>Role</th>
                                    <th style={{...thStyle, textAlign: 'right'}}>Actions</th>
                                </>
                            ) : (
                                <>
                                    <th style={thStyle}>Course Details</th>
                                    <th style={thStyle}>Instructor</th>
                                    <th style={{...thStyle, textAlign: 'right'}}>Actions</th>
                                </>
                            )
                            }
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center' }}>Loading data...</td></tr>
                        ) : currentItems.length === 0 ? (
                            <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No records found.</td></tr>
                        ) : (
                            currentItems.map(item => (
                                activeTab === 'users' ? (
                                    <UserRow 
                                        key={item.id} 
                                        user={item} 
                                        onRoleChange={handleRoleChange} 
                                        onDelete={handleDeleteUser} 
                                        getRoleStyle={getRoleStyle} 
                                    />
                                ) : (
                                    <CourseRow 
                                        key={item.id} 
                                        course={item} 
                                        onDelete={handleDeleteCourse} 
                                    />
                                )
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
                <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', gap: '10px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <button 
                        onClick={() => paginate(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="btn-secondary"
                        style={{ padding: '5px 15px', fontSize: '0.9rem', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    >
                        Previous
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', fontWeight: '600', color: '#475569' }}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button 
                        onClick={() => paginate(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        className="btn-secondary"
                        style={{ padding: '5px 15px', fontSize: '0.9rem', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

// --- SUB COMPONENTS ---

const StatCard = ({ title, value, icon, color }) => (
    <div className="card" style={{ padding: '20px', background: 'white', borderRadius: '12px', borderLeft: `5px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div>
            <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>{title}</p>
            <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#1e293b' }}>{value}</h3>
        </div>
        <div style={{ fontSize: '2.5rem', opacity: 0.2 }}>{icon}</div>
    </div>
);

const TabButton = ({ active, onClick, label }) => (
    <button 
        onClick={onClick}
        style={{ 
            padding: '15px 30px', 
            background: active ? 'white' : 'transparent', 
            border: 'none', 
            borderBottom: active ? '3px solid #3b82f6' : '3px solid transparent',
            color: active ? '#3b82f6' : '#64748b',
            fontWeight: '600', cursor: 'pointer',
            transition: 'all 0.2s'
        }}
    >
        {label}
    </button>
);

const UserRow = ({ user, onRoleChange, onDelete, getRoleStyle }) => (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
        <td style={{ padding: '15px 20px' }}>
            <div style={{ fontWeight: '600', color: '#1e293b' }}>{user.username}</div>
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{user.email}</div>
        </td>
        <td style={{ padding: '15px 20px' }}>
            <select
                value={user.role}
                onChange={(e) => onRoleChange(user.id, e.target.value)}
                style={{ 
                    padding: '6px 12px', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer',
                    ...getRoleStyle(user.role)
                }}
            >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
            </select>
        </td>
        <td style={{ padding: '15px 20px', textAlign: 'right' }}>
            <button onClick={() => onDelete(user.id, user.username)} className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer' }}>
                Delete
            </button>
        </td>
    </tr>
);

const CourseRow = ({ course, onDelete }) => (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
        <td style={{ padding: '15px 20px' }}>
            <div style={{ fontWeight: '600', color: '#1e293b' }}>{course.name}</div>
            <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                {course.course_catalog_code && <span style={badgeStyle}>{course.course_catalog_code}</span>}
                {course.semester_code && <span style={{...badgeStyle, background: '#f0fdf4', color: '#166534'}}>{course.semester_code}</span>}
            </div>
        </td>
        <td style={{ padding: '15px 20px' }}>
            <div style={{ color: '#334155', fontWeight: '500' }}>{course.teacher_name || "Unassigned"}</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{course.teacher_email || "N/A"}</div>
        </td>
        <td style={{ padding: '15px 20px', textAlign: 'right' }}>
            <button onClick={() => onDelete(course.id, course.name)} className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer' }}>
                Delete
            </button>
        </td>
    </tr>
);

const thStyle = { padding: '15px 20px', textAlign: 'left', fontSize: '0.85rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '600' };
const badgeStyle = { fontSize: '0.75rem', background: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' };

export default AdminUsers;