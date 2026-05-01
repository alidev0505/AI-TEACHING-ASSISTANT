import React from 'react';

const LiveClassesTab = ({ liveSessions, setShowSessionModal, handleDeleteSession, user }) => {
  // Ensure we are working with an array even if the parent passes null/undefined
  const sessions = liveSessions || [];

  return (
    <div style={{ padding: '4px' }}>
      {/* 1. Header Actions */}
      {user?.role === 'teacher' && (
        <div style={{ marginBottom: '20px', textAlign: 'right' }}>
          <button 
            onClick={() => setShowSessionModal(true)} 
            style={{ 
              background: 'linear-gradient(135deg,#1d4ed8,#0284c7)', 
              color: 'white', border: 'none', padding: '11px 22px', 
              borderRadius: '9px', cursor: 'pointer', fontWeight: '700', 
              fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(29, 78, 216, 0.2)' 
            }}
          >
            📅 Schedule New Class
          </button>
        </div>
      )}

      {/* 2. List Logic */}
      {sessions.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '2px dashed #e2e8f0', color: '#64748b' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📡</div>
          <h3 style={{ fontWeight: '700', margin: '0 0 8px 0' }}>No Live Classes Found</h3>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            {user?.role === 'teacher' 
              ? "You haven't scheduled any sessions for this specific course yet." 
              : "Your teacher hasn't scheduled any live sessions for this course yet."}
          </p>
        </div>
      ) : (
        sessions.map((session, index) => {
          
          // ✅ FIX: Flexibly check multiple possible variable names for the link
          const meetingUrl = session.link || session.meeting_link || session.join_url;

          return (
            <div 
              key={session.id || index} 
              style={{ 
                marginBottom: '16px', padding: '20px 24px', background: 'white', 
                borderRadius: '14px', borderLeft: '6px solid #2563eb', 
                borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', 
                borderBottom: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                    Incoming Session
                  </div>
                  <h3 style={{ margin: '0 0 6px 0', color: '#0f172a', fontWeight: '800', fontSize: '1.1rem' }}>
                    {session.title || "Untitled Session"}
                  </h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📅 {session.start_time ? new Date(session.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Time not set"}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* ✅ FIX: Join button now uses meetingUrl and unlocks correctly */}
                  <a 
                    href={meetingUrl || '#'} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ 
                      background: '#10b981', color: 'white', textDecoration: 'none', 
                      padding: '10px 20px', borderRadius: '8px', fontWeight: '700', 
                      fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                      pointerEvents: meetingUrl ? 'auto' : 'none', // Prevents clicking if no link
                      opacity: meetingUrl ? 1 : 0.5 // Dims the button if no link
                    }}
                  >
                    {meetingUrl ? 'Join Now →' : 'Link Pending'}
                  </a>

                  {user?.role === 'teacher' && (
                    <button 
                      onClick={() => handleDeleteSession(session.id)} 
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default LiveClassesTab;