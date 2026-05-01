import React from 'react';
import { Link } from 'react-router-dom';

const AssignmentsTab = ({ user, assignments, quizzes, newAssign, setNewAssign, handleCreateAssignment, handlePublishQuiz, handleDeleteAssignment, handleDownload, setAssignFile, setSolutionFile, solutionFile, assignFile, fetchSubmissions, viewingSubmissionsFor, submissions, setGradingSubmission, setActiveAssignmentId }) => (
  <div>
    {user.role === 'teacher' && (
       <div style={{ background: 'white', borderRadius: '14px', padding: '28px', marginBottom: '24px', border: '1px solid #e2e8f0', borderLeft: '5px solid #2563eb' }}>
       <h3 style={{ margin: '0 0 20px 0', fontWeight: '800' }}>📝 Create New Assignment</h3>
       <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
         <input placeholder="Assignment Title" value={newAssign.title} onChange={e => setNewAssign({ ...newAssign, title: e.target.value })} required style={{ padding: '11px', borderRadius: '8px', border: '1.5px solid #e2e8f0' }} />
         <input type="datetime-local" value={newAssign.deadline} onChange={e => setNewAssign({ ...newAssign, deadline: e.target.value })} required style={{ padding: '11px', borderRadius: '8px', border: '1.5px solid #e2e8f0' }} />
         <textarea placeholder="Instructions..." value={newAssign.description} onChange={e => setNewAssign({ ...newAssign, description: e.target.value })} style={{ padding: '11px', borderRadius: '8px', border: '1.5px solid #e2e8f0', minHeight: '80px' }} />
         <div style={{ background: '#f0fdf4', padding: '18px', borderRadius: '10px', border: '1px dashed #16a34a' }}>
           <label style={{ fontWeight: '700', color: '#166534' }}>🔑 Solution Key (REQUIRED for AI Grading):</label>
           <input type="file" accept=".pdf,.docx" onChange={e => setSolutionFile(e.target.files[0])} style={{ display: 'block', marginTop: '6px' }} />
           <textarea placeholder="Or paste solution text..." value={newAssign.teacher_solution} onChange={e => setNewAssign({ ...newAssign, teacher_solution: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #16a34a', marginTop: '6px' }} />
         </div>
         <button style={{ background: 'linear-gradient(135deg,#1d4ed8,#0284c7)', color: 'white', border: 'none', padding: '12px', borderRadius: '9px', cursor: 'pointer', fontWeight: '700' }}>Post Assignment</button>
       </form>
     </div>
    )}

    <h3 style={{ margin: '32px 0 16px 0', fontWeight: '800' }}>🧠 Assessments & Quizzes</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
      {quizzes.map(q => (
        <div key={q.id} style={{ padding: '24px', background: 'white', borderRadius: '14px', border: '1px solid #e0e7ff', borderLeft: `5px solid ${q.is_published ? '#6366f1' : '#94a3b8'}` }}>
          <h4 style={{ margin: '0 0 10px 0', fontWeight: '700' }}>🧩 {q.title}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '18px' }}>
            {user.role === 'teacher' ? (
              <>
                {!q.is_published && <button onClick={() => handlePublishQuiz(q.id)} style={{ padding: '10px', borderRadius: '9px', fontWeight: '700', color: 'white', background: '#22c55e', border: 'none', cursor: 'pointer' }}>Assign Now 🚀</button>}
                <Link to={`/quiz/${q.id}/view`} style={{ textAlign: 'center', textDecoration: 'none', padding: '10px', borderRadius: '9px', color: 'white', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>View Results</Link>
              </>
            ) : (
              q.is_published && <Link to={`/quiz/${q.id}/take`} style={{ textAlign: 'center', textDecoration: 'none', padding: '10px', borderRadius: '9px', color: 'white', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Start Quiz</Link>
            )}
          </div>
        </div>
      ))}
    </div>

    <h3 style={{ margin: '0 0 16px 0', fontWeight: '800' }}>📋 Active Tasks</h3>
    {assignments.map(a => (
      <div key={a.id} style={{ background: 'white', borderRadius: '14px', padding: '22px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h4>{a.title}</h4>
            {user.role === 'teacher' && <button onClick={() => handleDeleteAssignment(a.id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>}
         </div>
         {user.role === 'student' && (
             <div style={{ marginTop: '15px' }}>
                {a.my_submission ? <span style={{ color: 'green', fontWeight: 'bold' }}>✅ Submitted</span> : <button onClick={() => setActiveAssignmentId(a.id)} style={{ background: '#2563eb', color: 'white', padding: '10px', borderRadius: '8px' }}>Start Assignment 📝</button>}
             </div>
         )}
         {user.role === 'teacher' && (
             <button onClick={() => viewingSubmissionsFor === a.id ? null : fetchSubmissions(a.id)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginTop: '10px' }}>View Submissions</button>
         )}
      </div>
    ))}
  </div>
);

export default AssignmentsTab;