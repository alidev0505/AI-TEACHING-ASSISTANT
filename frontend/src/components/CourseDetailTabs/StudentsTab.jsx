import React from 'react';

const StudentsTab = ({ students, id, removeStudent, fetchStudents }) => {
  const handleRemove = async (studentId, studentName) => {
    if (window.confirm(`Are you sure you want to remove ${studentName} from this course?`)) {
      try {
        await removeStudent(id, studentId);
        fetchStudents();
      } catch (err) {
        alert("Failed to remove student.");
      }
    }
  };

  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          <tr>
            <th style={{ padding: '15px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Student Name</th>
            <th style={{ padding: '15px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Email Address</th>
            <th style={{ padding: '15px', textAlign: 'right', color: '#64748b', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                No students are currently enrolled in this course.
              </td>
            </tr>
          ) : (
            students.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                <td style={{ padding: '15px', fontWeight: '600', color: '#1e293b' }}>{s.username}</td>
                <td style={{ padding: '15px', color: '#64748b' }}>{s.email}</td>
                <td style={{ padding: '15px', textAlign: 'right' }}>
                  <button 
                    onClick={() => handleRemove(s.id, s.username)} 
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '0.8rem', 
                      background: '#fee2e2', 
                      color: '#dc2626', 
                      border: '1px solid #fecaca', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#fecaca'}
                    onMouseOut={(e) => e.target.style.background = '#fee2e2'}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StudentsTab;