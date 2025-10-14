import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MySeminarsPage from './pages/MySeminarsPage';
import CreateSeminarPage from './pages/CreateSeminarPage';
import EditSeminarPage from './pages/EditSeminarPage';
import SeminarRosterPage from './pages/SeminarRosterPage';
import SeminarAttendancePage from './pages/SeminarAttendancePage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import RostersPage from './pages/RostersPage';
import AttendancePage from './pages/AttendancePage';
import StudentCreditsPage from './pages/StudentCreditsPage';
import AdvisoryStudentsPage from './pages/AdvisoryStudentsPage';
import TransportationPage from './pages/TransportationPage';
import FundingPage from './pages/FundingPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import BrowseSeminarsPage from './pages/BrowseSeminarsPage';
import MyEnrollmentsPage from './pages/MyEnrollmentsPage';
import MySchedulePage from './pages/MySchedulePage';
import MyAttendancePage from './pages/MyAttendancePage';
import MyCreditsPage from './pages/MyCreditsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Navigate to="/teacher/dashboard" replace />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            
            {/* Teacher routes */}
            <Route path="/teacher/dashboard" element={
              <ProtectedRoute>
                <TeacherDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/teacher/my-seminars" element={
              <ProtectedRoute>
                <MySeminarsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/teacher/create-seminar" element={
              <ProtectedRoute>
                <CreateSeminarPage />
              </ProtectedRoute>
            } />
            
            <Route path="/teacher/edit-seminar/:id" element={
              <ProtectedRoute>
                <EditSeminarPage />
              </ProtectedRoute>
            } />
            
            <Route path="/teacher/roster/:seminarId" element={
              <ProtectedRoute>
                <SeminarRosterPage />
              </ProtectedRoute>
            } />
            
            <Route path="/teacher/attendance/:seminarId" element={
              <ProtectedRoute>
                <SeminarAttendancePage />
              </ProtectedRoute>
            } />

            <Route path="/teacher/rosters" element={
              <ProtectedRoute>
                <RostersPage />
              </ProtectedRoute>
            } />

            <Route path="/teacher/attendance" element={
              <ProtectedRoute>
                <AttendancePage />
              </ProtectedRoute>
            } />

            <Route path="/teacher/student-credits" element={
              <ProtectedRoute>
                <StudentCreditsPage />
              </ProtectedRoute>
            } />

            <Route path="/teacher/advisory-students" element={
              <ProtectedRoute>
                <AdvisoryStudentsPage />
              </ProtectedRoute>
            } />

            <Route path="/teacher/transportation" element={
              <ProtectedRoute>
                <TransportationPage />
              </ProtectedRoute>
            } />

            <Route path="/teacher/funding" element={
              <ProtectedRoute>
                <FundingPage />
              </ProtectedRoute>
            } />
            
            {/* Student routes */}
            <Route path="/student/dashboard" element={
              <ProtectedRoute>
                <StudentDashboardPage />
              </ProtectedRoute>
            } />
            
            <Route path="/student/browse-seminars" element={
              <ProtectedRoute>
                <BrowseSeminarsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/student/enrollments" element={
              <ProtectedRoute>
                <MyEnrollmentsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/student/schedule" element={
              <ProtectedRoute>
                <MySchedulePage />
              </ProtectedRoute>
            } />
            
            <Route path="/student/attendance" element={
              <ProtectedRoute>
                <MyAttendancePage />
              </ProtectedRoute>
            } />
            
            <Route path="/student/credits" element={
              <ProtectedRoute>
                <MyCreditsPage />
              </ProtectedRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/teacher/dashboard" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;

