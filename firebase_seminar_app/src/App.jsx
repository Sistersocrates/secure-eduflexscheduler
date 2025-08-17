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
import RosterPage from './pages/RosterPage';
import AttendancePage from './pages/AttendancePage';

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
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            
            {/* Teacher routes */}
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
                <RosterPage />
              </ProtectedRoute>
            } />
            
            <Route path="/teacher/attendance/:seminarId" element={
              <ProtectedRoute>
                <AttendancePage />
              </ProtectedRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;

