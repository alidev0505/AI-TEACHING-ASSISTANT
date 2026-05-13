import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import FeedbackModal from '../components/FeedbackModal';
import CreateSessionModal from '../components/CreateSessionModal';
import StudentAssignmentView from './StudentAssignmentView';
import GradingModal from '../components/GradingModal';

// Split Tab Components
import MaterialsTab from '../components/CourseDetailTabs/MaterialsTab';
import AssignmentsTab from '../components/CourseDetailTabs/AssignmentsTab';
import AIResourcesTab from '../components/CourseDetailTabs/AIResourcesTab';
import LiveClassesTab from '../components/CourseDetailTabs/LiveClassesTab';
import GradesTab from '../components/CourseDetailTabs/GradesTab';
import StudentsTab from '../components/CourseDetailTabs/StudentsTab';

import { AuthContext } from '../context/AuthContext';

import api, {
  getMaterials, uploadMaterial, createAssignment, getAssignments,
  submitAssignment, downloadFile, getSubmissions,
  getEnrolledStudents, removeStudent,
  deleteAssignment, getCourseGeneratedContent, deleteGeneratedContent,
  deleteMaterial, removeSubmission, dropCourse,
  deleteLiveSession,
  getLiveSessions,
  getStudentGrades,
  getAttendanceReport
} from '../services/api';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // --- STATES ---
  const [courseInfo, setCourseInfo] = useState({ name: '', count: 0, code: '' });
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [generatedResources, setGeneratedResources] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);

  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState(null);

  const [activeTab, setActiveTab] = useState('materials');
  const [uploading, setUploading] = useState(false);
  const [viewingSubmissionsFor, setViewingSubmissionsFor] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [activeAssignmentId, setActiveAssignmentId] = useState(null);
  const [gradingSubmission, setGradingSubmission] = useState(null);

  const [newAssign, setNewAssign] = useState({ title: '', description: '', deadline: '', teacher_solution: '' });
  const [assignFile, setAssignFile] = useState(null);
  const [solutionFile, setSolutionFile] = useState(null);

  useEffect(() => {
    fetchData();
    fetchQuizzes();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'students') fetchStudents();
    if (activeTab === 'ai_resources') fetchGeneratedResources();
    if (activeTab === 'live') fetchLiveSessions();
  }, [activeTab, id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const matRes = await getMaterials(id);
      setMaterials(matRes.data.materials || []);
      setCourseInfo({
        name: matRes.data.course_name,
        count: matRes.data.student_count,
        code: matRes.data.course_code || ''
      });

      const assRes = await getAssignments(id);
      setAssignments(assRes.data.assignments || []);

      if (user.role === 'student') {
        try {
          const gradeRes = await getStudentGrades(id);
          setGrades(gradeRes.data.grades || []);
          const attRes = await getAttendanceReport(id);
          setAttendance(attRes.data);
        } catch (e) { console.error("Error loading stats", e); }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchStudents = async () => {
    try {
      const res = await getEnrolledStudents(id);
      setStudents(res.data.students);
    } catch (err) { console.error(err); }
  };

  const fetchGeneratedResources = async () => {
    try {
      const res = await getCourseGeneratedContent(id);
      setGeneratedResources(res.data.generated_content || []);
    } catch (err) { console.error(err); }
  };

  // Find this function in CourseDetail.jsx and update it:
  // Find this function in CourseDetail.jsx and REPLACE it:
const fetchLiveSessions = async () => {
  try {
    const res = await getLiveSessions(id);
    console.log("Live Sessions API Response:", res.data); 

    // FIX: The console confirms the key is 'sessions'
    // We set it to liveSessions state which is what the Tab uses
    setLiveSessions(res.data.sessions || []); 
    
  } catch (err) { 
    console.error("Error fetching sessions:", err); 
    setLiveSessions([]); 
  }
};

  const fetchSubmissions = async (assignmentId) => {
    try {
      const res = await getSubmissions(assignmentId);
      setSubmissions(res.data.submissions);
      setViewingSubmissionsFor(assignmentId);
    } catch (err) { alert('Could not fetch submissions'); }
  };

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net/api/quiz/course/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setQuizzes(data.quizzes || []);
    } catch (err) { console.error(err); }
  };

  const handlePublishQuiz = async (quizId) => {
    if (!window.confirm("Publish this quiz and assign it to all students?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net/api/quiz/${quizId}/assign`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ is_published: true })
      });
      if (res.ok) {
        alert("🚀 Quiz assigned successfully!");
        fetchQuizzes();
      }
    } catch (err) { console.error(err); }
  };

  const handleExport = () => {
    if (!students || students.length === 0) return alert('No students found to export.');
    const headers = ['Student ID', 'Username', 'Email', 'University ID'];
    const rows = students.map(s => [s.id, s.username, s.email, s.university_id || 'N/A']);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${courseInfo.name}_Student_List.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMaterialUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    const formData = new FormData();
    formData.append('title', e.target.title.value);
    formData.append('course_id', id);
    formData.append('file', e.target.file.files[0]);

    try { await uploadMaterial(formData); e.target.reset(); fetchData(); }
    catch (err) { alert('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm("Are you sure you want to delete this lecture material?")) return;
    try { await deleteMaterial(materialId); fetchData(); }
    catch (err) { alert("Failed to delete material."); }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newAssign.title) return alert("Title is required");
    if (!newAssign.teacher_solution && !solutionFile) {
      return alert("You MUST provide a Solution Key (Text or File) for AI Grading.");
    }

    const formData = new FormData();
    formData.append('course_id', id);
    formData.append('title', newAssign.title);
    formData.append('description', newAssign.description);
    formData.append('deadline', newAssign.deadline);
    formData.append('teacher_solution', newAssign.teacher_solution);

    if (assignFile) formData.append('file', assignFile);
    if (solutionFile) formData.append('solution_file', solutionFile);

    try {
      await createAssignment(formData);
      alert('Assignment Created Successfully!');
      setNewAssign({ title: '', description: '', deadline: '', teacher_solution: '' });
      setAssignFile(null);
      setSolutionFile(null);
      fetchData();
    } catch (err) {
      alert('Failed to create assignment: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm("Delete this assignment and all submissions?")) return;
    try { await deleteAssignment(assignmentId); fetchData(); } catch (err) { alert("Failed."); }
  };

  const handleDeleteResource = async (contentId) => {
    if (!window.confirm("Are you sure you want to delete this generated resource?")) return;
    try { await deleteGeneratedContent(contentId); fetchGeneratedResources(); }
    catch (err) { alert("Failed to delete resource."); }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Cancel this live session?")) return;
    try { await deleteLiveSession(sessionId); fetchLiveSessions(); alert("Session Cancelled"); }
    catch (err) { alert("Failed to delete"); }
  }

  const handleDeleteCourse = async () => {
    if (!window.confirm("DANGER: Permanently delete this course and all data?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net/api/content/courses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) { alert("Course deleted."); navigate('/teacher'); }
    } catch (err) { alert("Server error."); }
  };

  const handleDownload = async (path, filename) => {
    try {
      const res = await downloadFile(path);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      let finalName = filename;
      const extension = path.split('.').pop();
      if (extension && !filename.toLowerCase().endsWith(`.${extension.toLowerCase()}`)) {
        finalName = `${filename}.${extension}`;
      }
      link.setAttribute('download', finalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { alert('Download failed'); }
  };

  if (loading) return (
    <div className="course-loading-wrap">
      <div className="spinner-box">
        <div className="spinner" />
        <p>Loading Classroom...</p>
      </div>
    </div>
  );

  if (activeAssignmentId && user.role === 'student') {
    return (
      <div className="assignment-view-page">
        <div className="container-inner">
          <button onClick={() => setActiveAssignmentId(null)} className="back-to-course-btn">
            ← Back to Course
          </button>
          <StudentAssignmentView assignmentId={activeAssignmentId} />
        </div>
      </div>
    );
  }

  return (
    <div className="course-detail-page">

      {/* HERO HEADER */}
      <div className="course-hero">
        <div className="hero-pattern-bg" />
        <div className="hero-container">
          <button onClick={() => navigate(user?.role === 'teacher' ? '/teacher' : '/student')} className="dashboard-back-btn">
            ← Dashboard
          </button>

          <div className="hero-main-flex">
            <div className="course-info-block">
              <h1>{courseInfo.name || 'Course Content'}</h1>
              <div className="course-meta-pills">
                <span className="meta-pill">👥 {courseInfo.count} Students</span>
                {courseInfo.code && <span className="meta-pill code">Code: {courseInfo.code}</span>}
                {user.role === 'teacher' && (
                  <Link to={`/course/${id}/analytics`} className="analytics-link">📊 Analytics →</Link>
                )}
              </div>
            </div>

            <div className="course-action-btns">
                {user && user.role === 'student' && (
                <button onClick={() => setShowFeedback(true)} className="rate-btn">⭐ Rate</button>
                )}
                
                {user.role === 'teacher' ? (
                <>
                    <button onClick={handleExport} className="action-btn-outline">Export CSV</button>
                    <Link to={`/attendance/${id}`} className="action-btn-primary blue">Attendance</Link>
                    <Link to={`/course/${id}/create-quiz`} className="action-btn-primary purple">Create Quiz</Link>
                    <button onClick={handleDeleteCourse} className="action-btn-danger">Delete</button>
                </>
                ) : (
                <button onClick={async () => { if (window.confirm("Drop course?")) { await dropCourse(id); navigate('/student'); } }} className="action-btn-danger">Drop Course</button>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className="main-content-container">
        {/* TAB BAR (Horizontally scrollable on mobile) */}
        <div className="tab-bar-wrapper">
            <div className="tab-bar">
            {['materials', 'assignments', 'grades', 'ai_resources', 'live', 'students'].map(tab => {
    // Remove 'live' from this check so students can see it
              if ((tab === 'students' || tab === 'ai_resources') && user.role !== 'teacher') return null;
                if (tab === 'grades' && user.role === 'teacher') return null;
                const label = tab === 'materials' ? (user.role === 'student' ? 'Lectures' : 'Materials')
                : tab === 'assignments' ? 'Assignments'
                    : tab === 'grades' ? 'Grades'
                    : tab === 'ai_resources' ? 'Resources'
                        : tab === 'live' ? 'Live'
                        : 'Students';
                return (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item ${activeTab === tab ? 'active' : ''}`}>
                    {label}
                </button>
                );
            })}
            </div>
        </div>

        {/* --- DYNAMIC TABS --- */}
        {/* --- DYNAMIC TABS --- */}
        <div className="tab-content">
            {activeTab === 'materials' && (
            <MaterialsTab 
                user={user} materials={materials} uploading={uploading}
                handleMaterialUpload={handleMaterialUpload} handleDeleteMaterial={handleDeleteMaterial} handleDownload={handleDownload}
            />
            )}
            {activeTab === 'assignments' && (
            <AssignmentsTab 
                user={user} assignments={assignments} quizzes={quizzes} newAssign={newAssign} setNewAssign={setNewAssign}
                handleCreateAssignment={handleCreateAssignment} handlePublishQuiz={handlePublishQuiz} handleDeleteAssignment={handleDeleteAssignment}
                handleDownload={handleDownload} setAssignFile={setAssignFile} setSolutionFile={setSolutionFile} fetchSubmissions={fetchSubmissions}
                viewingSubmissionsFor={viewingSubmissionsFor} submissions={submissions} setGradingSubmission={setGradingSubmission} setActiveAssignmentId={setActiveAssignmentId}
            />
            )}
            {activeTab === 'ai_resources' && <AIResourcesTab generatedResources={generatedResources} handleDeleteResource={handleDeleteResource} />}
            
            {activeTab === 'live' && (
              <LiveClassesTab 
                liveSessions={liveSessions} 
                setShowSessionModal={setShowSessionModal} 
                handleDeleteSession={handleDeleteSession}
                user={user} 
              />
            )}

            {activeTab === 'grades' && <GradesTab grades={grades} />}
            {activeTab === 'students' && <StudentsTab students={students} id={id} removeStudent={removeStudent} fetchStudents={fetchStudents} />}
        </div>
      </div>

      {showFeedback && <FeedbackModal courseId={id} onClose={() => setShowFeedback(false)} />}
      {showSessionModal && <CreateSessionModal courseId={id} onClose={() => setShowSessionModal(false)} onSuccess={fetchLiveSessions} />}
      {gradingSubmission && (
        <GradingModal
          submission={gradingSubmission.sub} assignmentTitle={gradingSubmission.title}
          onClose={() => setGradingSubmission(null)} onSuccess={() => fetchSubmissions(gradingSubmission.assignmentId)}
        />
      )}

      <style>{`
        .course-detail-page { background: #f8fafc; min-height: 100vh; padding-bottom: 60px; font-family: 'Inter', sans-serif; }
        
        .course-hero { background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); padding: 40px 0 100px; position: relative; overflow: hidden; }
        .hero-pattern-bg { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 28px 28px; }
        .hero-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; position: relative; }
        
        .dashboard-back-btn { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; margin-bottom: 25px; }
        
        .hero-main-flex { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 30px; }
        .course-info-block h1 { color: white; font-size: clamp(1.8rem, 5vw, 2.6rem); font-weight: 900; margin: 0; letter-spacing: -1px; }
        .course-meta-pills { display: flex; align-items: center; gap: 12px; margin-top: 15px; flex-wrap: wrap; }
        .meta-pill { background: rgba(255,255,255,0.15); padding: 6px 16px; border-radius: 50px; font-size: 0.85rem; color: white; font-weight: 600; }
        .meta-pill.code { background: rgba(255,255,255,0.1); }
        .analytics-link { color: #93c5fd; text-decoration: none; font-weight: 700; font-size: 0.9rem; }

        .course-action-btns { display: flex; gap: 10px; flex-wrap: wrap; }
        .action-btn-primary { border: none; padding: 12px 20px; border-radius: 10px; color: white; font-weight: 700; text-decoration: none; font-size: 0.9rem; }
        .action-btn-primary.blue { background: #3b82f6; }
        .action-btn-primary.purple { background: #8b5cf6; }
        .action-btn-outline { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 12px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; }
        .action-btn-danger { background: #ef4444; color: white; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; }
        .rate-btn { background: #fbbf24; color: #78350f; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 800; cursor: pointer; }

        .main-content-container { max-width: 1280px; margin: -40px auto 0; padding: 0 24px; position: relative; z-index: 10; }
        
        .tab-bar-wrapper { overflow-x: auto; background: white; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; margin-bottom: 30px; scrollbar-width: none; }
        .tab-bar-wrapper::-webkit-scrollbar { display: none; }
        .tab-bar { display: flex; min-width: max-content; width: 100%; }
        
        .tab-item { flex: 1; padding: 18px 25px; border: none; background: transparent; color: #64748b; font-weight: 600; font-size: 0.9rem; cursor: pointer; border-bottom: 3px solid transparent; transition: 0.2s; white-space: nowrap; }
        .tab-item.active { background: #eff6ff; color: #1d4ed8; border-bottom-color: #1d4ed8; font-weight: 800; }

        .course-loading-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
        .spinner { width: 48px; height: 48px; border: 4px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
            .hero-main-flex { flex-direction: column; align-items: center; text-align: center; }
            .course-meta-pills { justify-content: center; }
            .course-action-btns { justify-content: center; width: 100%; }
            .course-action-btns > * { flex: 1; min-width: 140px; text-align: center; }
            .course-hero { padding-bottom: 80px; }
            .main-content-container { margin-top: -30px; }
        }
      `}</style>
    </div>
  );
};

export default CourseDetail;