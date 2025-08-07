import React from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import { useAuth } from '../AuthProvider';

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;

