import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

// Placeholder components for future implementation
const PlaceholderPage = ({ title, description }) => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    <p className="text-gray-600 mt-2">{description}</p>
    <p className="text-sm text-blue-600 mt-4">This feature will be implemented in the next update.</p>
  </div>
);

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
                <HomePage />
              </ProtectedRoute>
            } />
            
            {/* Student Routes */}
            <Route path="/seminars" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Browse Seminars" 
                  description="Discover and enroll in available seminars"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/schedule" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="My Schedule" 
                  description="View your personal schedule and upcoming events"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/enrollments" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="My Enrollments" 
                  description="Manage your seminar enrollments"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/waitlists" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Waitlists" 
                  description="View and manage your waitlist positions"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/appointments" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Appointments" 
                  description="Schedule and manage counseling appointments"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/progress" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Academic Progress" 
                  description="Track your academic progress and achievements"
                />
              </ProtectedRoute>
            } />
            
            {/* Teacher Routes */}
            <Route path="/my-seminars" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="My Seminars" 
                  description="Manage your seminars and course content"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/rosters" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Student Rosters" 
                  description="View and manage student rosters for your seminars"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/attendance" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Attendance" 
                  description="Take and manage student attendance"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/grading" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Grading" 
                  description="Grade assignments and manage student assessments"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Reports" 
                  description="Generate and view teaching reports"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/analytics" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Analytics" 
                  description="View detailed analytics for your seminars"
                />
              </ProtectedRoute>
            } />
            
            {/* Counselor Routes */}
            <Route path="/student-management" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Student Management" 
                  description="Manage and support student academic journeys"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/counselor-appointments" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Counselor Appointments" 
                  description="Manage counseling appointments and sessions"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/student-progress" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Student Progress" 
                  description="Monitor and track student academic progress"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/counselor-reports" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Counselor Reports" 
                  description="Generate student progress and counseling reports"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/resources" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Resources" 
                  description="Access counseling resources and materials"
                />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRole="admin">
                <PlaceholderPage 
                  title="User Management" 
                  description="Manage system users and permissions"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/settings" element={
              <ProtectedRoute requiredRole="admin">
                <PlaceholderPage 
                  title="System Settings" 
                  description="Configure system settings and preferences"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/analytics" element={
              <ProtectedRoute requiredRole="admin">
                <PlaceholderPage 
                  title="System Analytics" 
                  description="View comprehensive system analytics and metrics"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/reports" element={
              <ProtectedRoute requiredRole="admin">
                <PlaceholderPage 
                  title="System Reports" 
                  description="Generate and view system-wide reports"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/data" element={
              <ProtectedRoute requiredRole="admin">
                <PlaceholderPage 
                  title="Data Import/Export" 
                  description="Import and export system data"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/security" element={
              <ProtectedRoute requiredRole="admin">
                <PlaceholderPage 
                  title="Security Management" 
                  description="Manage system security and audit logs"
                />
              </ProtectedRoute>
            } />
            
            {/* Common Routes */}
            <Route path="/messages" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Messages" 
                  description="Send and receive messages with other users"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/notifications" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Notifications" 
                  description="View and manage your notifications"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Profile" 
                  description="Manage your profile information"
                />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Settings" 
                  description="Configure your account settings and preferences"
                />
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

