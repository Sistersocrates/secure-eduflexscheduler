import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import { signOutUser } from '../../lib/firebase';
import {
  Menu,
  X,
  Home,
  Calendar,
  BookOpen,
  Users,
  Settings,
  Bell,
  MessageSquare,
  BarChart3,
  FileText,
  Clock,
  UserCheck,
  GraduationCap,
  Shield,
  LogOut,
  ChevronDown,
  User,
  Target,
  Database,
  Building2,
  Monitor
} from 'lucide-react';

const Navigation = () => {
  const { user, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Role-based navigation items
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Schedule', href: '/schedule', icon: Calendar },
      { name: 'Messages', href: '/messages', icon: MessageSquare },
      { name: 'Notifications', href: '/notifications', icon: Bell }
    ];

    const roleSpecificItems = {
      student: [
        { name: 'Browse Seminars', href: '/seminars', icon: BookOpen },
        { name: 'My Enrollments', href: '/enrollments', icon: GraduationCap },
        { name: 'Waitlists', href: '/waitlists', icon: Clock },
        { name: 'Appointments', href: '/appointments', icon: UserCheck },
        { name: 'Progress', href: '/progress', icon: BarChart3 }
      ],
      teacher: [
        { name: 'My Seminars', href: '/my-seminars', icon: BookOpen },
        { name: 'Student Rosters', href: '/rosters', icon: Users },
        { name: 'Attendance', href: '/attendance', icon: UserCheck },
        { name: 'Grading', href: '/grading', icon: FileText },
        { name: 'Reports', href: '/reports', icon: BarChart3 },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 }
      ],
      counselor: [
        { name: 'Student Management', href: '/student-management', icon: Users },
        { name: 'Appointments', href: '/counselor-appointments', icon: UserCheck },
        { name: 'Student Progress', href: '/student-progress', icon: BarChart3 },
        { name: 'Reports', href: '/counselor-reports', icon: FileText },
        { name: 'Resources', href: '/resources', icon: BookOpen }
      ],
      specialist: [
        { name: 'Appointments', href: '/specialist-appointments', icon: UserCheck },
        { name: 'Student Notes', href: '/student-notes', icon: FileText },
        { name: 'Intervention Plans', href: '/intervention-plans', icon: Target },
        { name: 'Progress Tracking', href: '/progress-tracking', icon: BarChart3 },
        { name: 'Communication Logs', href: '/communication-logs', icon: MessageSquare },
        { name: 'Resource Library', href: '/resource-library', icon: BookOpen },
        { name: 'Analytics', href: '/specialist-analytics', icon: BarChart3 }
      ],
      admin: [
        { name: 'System Overview', href: '/admin', icon: Monitor },
        { name: 'User Management', href: '/admin/users', icon: Users },
        { name: 'Tenant Management', href: '/admin/tenants', icon: Building2 },
        { name: 'System Settings', href: '/admin/settings', icon: Settings },
        { name: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
        { name: 'System Logs', href: '/admin/logs', icon: FileText },
        { name: 'Security Center', href: '/admin/security', icon: Shield },
        { name: 'Database Management', href: '/admin/database', icon: Database }
      ]
    };

    return [...baseItems, ...(roleSpecificItems[userRole] || [])];
  };

  const navigationItems = getNavigationItems();

  const isActive = (href) => {
    return location.pathname === href;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      student: 'bg-blue-100 text-blue-800',
      teacher: 'bg-green-100 text-green-800',
      counselor: 'bg-purple-100 text-purple-800',
      specialist: 'bg-orange-100 text-orange-800',
      admin: 'bg-red-100 text-red-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">EduFlex</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.slice(0, 6).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* More dropdown for additional items */}
            {navigationItems.length > 6 && (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex items-center space-x-1"
                >
                  <span>More</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    {navigationItems.slice(6).map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User profile dropdown */}
          <div className="flex items-center space-x-4">
            {/* Role badge */}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(userRole)}`}>
              {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
            </span>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {user.photoURL ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user.photoURL}
                    alt={user.displayName}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                )}
                <ChevronDown className="h-4 w-4 text-gray-600" />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                  
                  <Link
                    to="/settings"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                  
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;

