import React, { useContext } from 'react'; 
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext'; 
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LiveClasses from './pages/LiveClasses';
import Attendance from './pages/Attendance';
import CreateQuiz from "./pages/CreateQuiz";
import TakeQuiz from './pages/TakeQuiz';
import QuizDetails from './pages/QuizDetails';
import TeacherAnalytics from './pages/TeacherAnalytics';
import StudentAttendance from './pages/StudentAttendance';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import CourseDetail from './pages/CourseDetail';
import GenerateContent from './pages/GenerateContent';
import Profile from './pages/Profile'; // ✅ ADDED: Profile Page Import

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminReports from './pages/admin/AdminReports';
import AdminDepartments from './pages/admin/AdminDepartments';
import ManageSemesters from './pages/admin/ManageSemesters';
import AdminClass from './pages/admin/AdminClass';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminBatchUpload from './pages/admin/AdminBatchUpload';
import AdminFeedback from './pages/admin/AdminFeedback';

import './App.css';

const AppContent = () => {
  const location = useLocation();
  const { loading } = useContext(AuthContext); 

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2>Loading AI Assistant...</h2>
      </div>
    );
  }

  const isLandingPage = location.pathname === '/';

  return (
    <>
      {!isLandingPage && <Navbar />}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* --- General Protected Routes --- */}
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute> 
        } />

        {/* --- Teacher Routes --- */}
        <Route path="/teacher" element={
          <ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>
        } />
        <Route path="/course/:courseId/create-quiz" element={
          <ProtectedRoute role="teacher"><CreateQuiz /></ProtectedRoute>
        } />
        {/* Standard path */}
        <Route path="/quiz/:quizId/take" element={
          <ProtectedRoute role="student"><TakeQuiz /></ProtectedRoute>
        } />
        {/* Add this for Dashboard compatibility */}
        <Route path="/take-quiz/:quizId" element={
          <ProtectedRoute role="student"><TakeQuiz /></ProtectedRoute>
        } />
        <Route path="/quiz/:quizId/view" element={
          <ProtectedRoute role="teacher"><QuizDetails /></ProtectedRoute>
        } />
        <Route path="/course/:courseId/analytics" element={
          <ProtectedRoute role="teacher"><TeacherAnalytics /></ProtectedRoute>
        } />
        <Route path="/attendance/:courseId" element={
          <ProtectedRoute role="teacher"><Attendance /></ProtectedRoute>
        } />
        <Route path="/live-classes" element={
          <ProtectedRoute><LiveClasses /></ProtectedRoute>
        } />
        <Route path="/generate/:materialId" element={
          <ProtectedRoute role="teacher"><GenerateContent /></ProtectedRoute>
        } />

        {/* --- Student Routes --- */}
        <Route path="/student" element={
          <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
        } />
        <Route path="/student/attendance" element={
          <ProtectedRoute role="student"><StudentAttendance /></ProtectedRoute>
        } />
        
        {/* Shared Course Detail (Teacher & Student) */}
        <Route path="/course/:id" element={
          <ProtectedRoute><CourseDetail /></ProtectedRoute>
        } />

        {/* --- Admin Routes --- */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>
        } />
        <Route path="/admin/courses" element={
          <ProtectedRoute role="admin"><AdminCourses /></ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>
        } />
        <Route path="/admin/semesters" element={
          <ProtectedRoute role="admin"><ManageSemesters /></ProtectedRoute>
        } />
        <Route path="/admin/departments" element={
          <ProtectedRoute role="admin"><AdminDepartments /></ProtectedRoute>
        } />
        <Route path="/admin/feedback" element={
            <ProtectedRoute role="admin"><AdminFeedback /></ProtectedRoute>
        } />
        <Route path="/admin/announcements" element={
          <ProtectedRoute role="admin"><AdminAnnouncements /></ProtectedRoute>
        } />
        <Route path="/admin/classes" element={
            <ProtectedRoute role="admin"><AdminClass /></ProtectedRoute>
        } />
        <Route path="/admin/upload" element={
            <ProtectedRoute role="admin"><AdminBatchUpload /></ProtectedRoute>
        } />
        <Route path="/admin/calendar" element={
            <ProtectedRoute role="admin"><AdminCalendar /></ProtectedRoute>
        } />

        {/* Catch All 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;