import React from 'react';

const GradesTab = ({ grades }) => (
  <div className="card" style={{ padding: '0', overflow: 'hidden', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
        <tr>
          <th style={{ padding: '15px', textAlign: 'left', color: '#64748b' }}>Item</th>
          <th style={{ padding: '15px', textAlign: 'left', color: '#64748b' }}>Type</th>
          <th style={{ padding: '15px', textAlign: 'left', color: '#64748b' }}>Date</th>
          <th style={{ padding: '15px', textAlign: 'right', color: '#64748b' }}>Score/Status</th>
        </tr>
      </thead>
      <tbody>
        {grades.length === 0 ? (
          <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No grades available yet.</td></tr>
        ) : (
          grades.map((g, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '15px', fontWeight: '600', color: '#1e293b' }}>{g.title}</td>
              <td style={{ padding: '15px' }}>
                <span style={{ background: g.type === 'Quiz' ? '#e0e7ff' : '#fef3c7', color: g.type === 'Quiz' ? '#4338ca' : '#92400e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{g.type}</span>
              </td>
              <td style={{ padding: '15px', color: '#64748b' }}>{g.date}</td>
              <td style={{ padding: '15px', textAlign: 'right' }}>
                <span style={{ fontWeight: 'bold', color: g.score >= 50 ? '#166534' : '#d97706' }}>
                  {g.status === 'Graded' ? `✅ ${g.score}/100` : g.status}
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default GradesTab;