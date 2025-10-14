import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import TeacherNav from './TeacherNav';
import StudentNav from './StudentNav';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Don't show navigation on login page
  const isLoginPage = location.pathname === '/login';
  
  if (isLoginPage || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  // Show teacher navigation for teacher routes
  const isTeacherRoute = location.pathname.startsWith('/teacher');
  const isStudentRoute = location.pathname.startsWith('/student');
  
  if (isTeacherRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex">
        <TeacherNav />
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  if (isStudentRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex">
        <StudentNav />
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
};

export default Layout;