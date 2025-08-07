import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { signInWithGoogle, createUserProfile } from '../lib/firebase';
import { GraduationCap, Shield, Users, BookOpen, UserCheck } from 'lucide-react';

const LoginPage = () => {
  const { user, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState({
    department: '',
    studentId: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  const roles = [
    {
      id: 'student',
      name: 'Student',
      description: 'Access seminars, schedule, and track your academic progress',
      icon: GraduationCap,
      color: 'blue'
    },
    {
      id: 'teacher',
      name: 'Teacher/Faculty',
      description: 'Manage seminars, track attendance, and grade students',
      icon: BookOpen,
      color: 'green'
    },
    {
      id: 'counselor',
      name: 'Counselor',
      description: 'Support students, manage appointments, and track progress',
      icon: UserCheck,
      color: 'purple'
    },
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Manage users, system settings, and access analytics',
      icon: Shield,
      color: 'red'
    }
  ];

  const handleGoogleSignIn = async () => {
    if (!selectedRole) {
      setError('Please select your role before signing in');
      return;
    }

    setIsSigningIn(true);
    setError('');

    try {
      const result = await signInWithGoogle();
      
      if (result.error) {
        setError(result.error);
      } else if (result.user) {
        // Create user document with selected role and additional info
        await createUserProfile(result.user, {
          role: selectedRole,
          ...additionalInfo
        });
      }
    } catch (error) {
      setError('Failed to sign in. Please try again.');
      console.error('Sign in error:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const getRoleColor = (color) => {
    const colors = {
      blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700',
      green: 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700',
      purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700',
      red: 'border-red-200 bg-red-50 hover:bg-red-100 text-red-700'
    };
    return colors[color] || colors.blue;
  };

  const getSelectedRoleColor = (color) => {
    const colors = {
      blue: 'border-blue-500 bg-blue-100 text-blue-800',
      green: 'border-green-500 bg-green-100 text-green-800',
      purple: 'border-purple-500 bg-purple-100 text-purple-800',
      red: 'border-red-500 bg-red-100 text-red-800'
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <GraduationCap className="h-16 w-16 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to EduFlex
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Secure, FERPA-compliant seminar management system
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select your role to continue
            </label>
            <div className="grid grid-cols-1 gap-3">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                      isSelected 
                        ? getSelectedRoleColor(role.color)
                        : `${getRoleColor(role.color)} border-gray-200`
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className="h-6 w-6 mt-1" />
                      <div>
                        <h3 className="font-medium">{role.name}</h3>
                        <p className="text-sm opacity-75 mt-1">{role.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Information for specific roles */}
          {(selectedRole === 'student' || selectedRole === 'teacher') && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Additional Information</h4>
              
              {selectedRole === 'student' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Student ID (Optional)</label>
                  <input
                    type="text"
                    value={additionalInfo.studentId}
                    onChange={(e) => setAdditionalInfo(prev => ({ ...prev, studentId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your student ID"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Department (Optional)</label>
                <input
                  type="text"
                  value={additionalInfo.department}
                  onChange={(e) => setAdditionalInfo(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Computer Science, Mathematics"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={additionalInfo.phoneNumber}
                  onChange={(e) => setAdditionalInfo(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn || !selectedRole}
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isSigningIn ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Security Notice */}
          <div className="bg-gray-50 rounded-md p-4">
            <div className="flex items-start space-x-2">
              <Shield className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Security & Privacy</h4>
                <p className="text-xs text-gray-600 mt-1">
                  This system is FERPA-compliant and uses enterprise-grade security. 
                  All user actions are logged for compliance and security purposes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© 2025 EduFlex Scheduler. Built with Firebase & React.</p>
          <p className="mt-1">🔒 Secure • 📚 FERPA Compliant • 🚀 Modern</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

