import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { 
  Home, 
  Search, 
  Calendar, 
  List, 
  CheckSquare, 
  Award, 
  LogOut,
  User
} from 'lucide-react';

const StudentNav = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    {
      path: '/student/dashboard',
      icon: Home,
      label: 'Dashboard',
    },
    {
      path: '/student/browse-seminars',
      icon: Search,
      label: 'Browse Seminars',
    },
    {
      path: '/student/schedule',
      icon: Calendar,
      label: 'My Schedule',
    },
    {
      path: '/student/enrollments',
      icon: List,
      label: 'My Enrollments',
    },
    {
      path: '/student/attendance',
      icon: CheckSquare,
      label: 'My Attendance',
    },
    {
      path: '/student/credits',
      icon: Award,
      label: 'Credits & Progress',
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="w-64 bg-white shadow-lg flex flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">SCL Scheduler</h1>
        <p className="text-sm text-gray-600 mt-1">Student Portal</p>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
              }`}
            >
              <Icon className={`h-5 w-5 mr-3 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* User Section */}
      <div className="border-t border-gray-200 p-4">
        {user && (
          <div className="mb-4">
            <div className="flex items-center">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
              )}
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.displayName || 'Student'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default StudentNav;

