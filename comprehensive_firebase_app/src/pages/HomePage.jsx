import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { getAvailableClasses, getStudentEnrollments } from '../lib/firebase';
import {
  Calendar,
  BookOpen,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  GraduationCap,
  UserCheck,
  FileText,
  Settings,
  Bell,
  MessageSquare,
  Plus,
  ArrowRight,
  Shield,
  Database,
  Activity,
  Server,
  Lock,
  Monitor,
  Zap,
  Globe
} from 'lucide-react';

const HomePage = () => {
  const { user, userRole, userProfile } = useAuth();
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingSeminars, setUpcomingSeminars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (userRole === 'student') {
          const enrollments = await getStudentEnrollments(user.uid);
          const classes = await getAvailableClasses();
          
          setStats({
            enrolledSeminars: enrollments.length,
            completedSeminars: enrollments.filter(e => e.status === 'completed').length,
            upcomingEvents: enrollments.filter(e => e.status === 'enrolled').length,
            totalCredits: enrollments.reduce((sum, e) => sum + (e.class?.credits || 0), 0)
          });
          
          setUpcomingSeminars(classes.slice(0, 3));
          setRecentActivity([
            { type: 'enrollment', message: 'Enrolled in Advanced React Patterns', time: '2 hours ago' },
            { type: 'completion', message: 'Completed JavaScript Fundamentals', time: '1 day ago' },
            { type: 'reminder', message: 'Upcoming seminar: Data Structures', time: '2 days ago' }
          ]);
        } else if (userRole === 'teacher') {
          const classes = await getAvailableClasses();
          
          setStats({
            mySeminars: classes.length,
            totalStudents: classes.reduce((sum, s) => sum + (s.currentEnrollment || 0), 0),
            activeSeminars: classes.filter(s => s.status === 'active').length,
            avgRating: 4.7
          });
          
          setRecentActivity([
            { type: 'enrollment', message: '5 new students enrolled in React Basics', time: '1 hour ago' },
            { type: 'completion', message: 'Graded assignments for Advanced JavaScript', time: '3 hours ago' },
            { type: 'creation', message: 'Created new seminar: Node.js Fundamentals', time: '1 day ago' }
          ]);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && userRole) {
      loadDashboardData();
    }
  }, [user, userRole]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = userProfile?.displayName || user?.displayName || 'there';
    
    if (hour < 12) return `Good morning, ${name}!`;
    if (hour < 17) return `Good afternoon, ${name}!`;
    return `Good evening, ${name}!`;
  };

  const getRoleSpecificQuickActions = () => {
    const actions = {
      student: [
        { name: 'Browse Seminars', href: '/seminars', icon: BookOpen, color: 'blue' },
        { name: 'View Schedule', href: '/schedule', icon: Calendar, color: 'green' },
        { name: 'My Enrollments', href: '/enrollments', icon: GraduationCap, color: 'purple' },
        { name: 'Book Appointment', href: '/appointments', icon: UserCheck, color: 'orange' }
      ],
      teacher: [
        { name: 'Create Seminar', href: '/create-seminar', icon: Plus, color: 'blue' },
        { name: 'My Seminars', href: '/my-seminars', icon: BookOpen, color: 'green' },
        { name: 'Take Attendance', href: '/attendance', icon: UserCheck, color: 'purple' },
        { name: 'Grade Assignments', href: '/grading', icon: FileText, color: 'orange' }
      ],
      counselor: [
        { name: 'Student Management', href: '/student-management', icon: Users, color: 'blue' },
        { name: 'Appointments', href: '/counselor-appointments', icon: UserCheck, color: 'green' },
        { name: 'Progress Reports', href: '/student-progress', icon: BarChart3, color: 'purple' },
        { name: 'Resources', href: '/resources', icon: BookOpen, color: 'orange' }
      ],
      specialist: [
        { name: 'Appointments', href: '/specialist-appointments', icon: UserCheck, color: 'blue' },
        { name: 'Student Notes', href: '/student-notes', icon: FileText, color: 'green' },
        { name: 'Intervention Plans', href: '/intervention-plans', icon: BarChart3, color: 'purple' },
        { name: 'Progress Tracking', href: '/progress-tracking', icon: TrendingUp, color: 'orange' }
      ],
      admin: [
        { name: 'User Management', href: '/admin/users', icon: Users, color: 'blue' },
        { name: 'System Analytics', href: '/admin/analytics', icon: BarChart3, color: 'green' },
        { name: 'Security Center', href: '/admin/security', icon: Shield, color: 'red' },
        { name: 'Database Admin', href: '/admin/database', icon: Database, color: 'purple' },
        { name: 'System Monitor', href: '/admin/monitoring', icon: Monitor, color: 'orange' },
        { name: 'Settings', href: '/admin/settings', icon: Settings, color: 'gray' },
        { name: 'Reports', href: '/admin/reports', icon: FileText, color: 'indigo' },
        { name: 'System Logs', href: '/admin/logs', icon: Activity, color: 'yellow' }
      ]
    };

    return actions[userRole] || [];
  };

  const getStatsCards = () => {
    const cards = {
      student: [
        { name: 'Enrolled Seminars', value: stats.enrolledSeminars || 0, icon: BookOpen, color: 'blue' },
        { name: 'Completed', value: stats.completedSeminars || 0, icon: CheckCircle, color: 'green' },
        { name: 'Upcoming Events', value: stats.upcomingEvents || 0, icon: Clock, color: 'yellow' },
        { name: 'Total Credits', value: stats.totalCredits || 0, icon: GraduationCap, color: 'purple' }
      ],
      teacher: [
        { name: 'My Seminars', value: stats.mySeminars || 0, icon: BookOpen, color: 'blue' },
        { name: 'Total Students', value: stats.totalStudents || 0, icon: Users, color: 'green' },
        { name: 'Active Seminars', value: stats.activeSeminars || 0, icon: TrendingUp, color: 'yellow' },
        { name: 'Avg Rating', value: stats.avgRating || 0, icon: BarChart3, color: 'purple' }
      ],
      counselor: [
        { name: 'Active Students', value: 45, icon: Users, color: 'blue' },
        { name: 'Appointments Today', value: 8, icon: UserCheck, color: 'green' },
        { name: 'Pending Reviews', value: 12, icon: Clock, color: 'yellow' },
        { name: 'Success Rate', value: '94%', icon: TrendingUp, color: 'purple' }
      ],
      specialist: [
        { name: 'Active Plans', value: 23, icon: BarChart3, color: 'blue' },
        { name: 'Appointments Today', value: 6, icon: UserCheck, color: 'green' },
        { name: 'Students Served', value: 45, icon: Users, color: 'yellow' },
        { name: 'Progress Rate', value: '89%', icon: TrendingUp, color: 'purple' }
      ],
      admin: [
        { name: 'Total Users', value: 1247, icon: Users, color: 'blue' },
        { name: 'Active Sessions', value: 89, icon: Activity, color: 'green' },
        { name: 'System Health', value: '99.9%', icon: Server, color: 'yellow' },
        { name: 'Security Score', value: '98%', icon: Shield, color: 'red' },
        { name: 'Database Size', value: '2.4GB', icon: Database, color: 'purple' },
        { name: 'API Calls/min', value: '1.2K', icon: Zap, color: 'orange' },
        { name: 'Uptime', value: '99.99%', icon: Monitor, color: 'indigo' },
        { name: 'Global Users', value: '24', icon: Globe, color: 'teal' }
      ]
    };

    return cards[userRole] || [];
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white',
      yellow: 'bg-yellow-500 text-white',
      purple: 'bg-purple-500 text-white',
      orange: 'bg-orange-500 text-white',
      red: 'bg-red-500 text-white',
      gray: 'bg-gray-500 text-white',
      indigo: 'bg-indigo-500 text-white',
      teal: 'bg-teal-500 text-white'
    };
    return colors[color] || colors.blue;
  };

  const getBgColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200',
      yellow: 'bg-yellow-50 border-yellow-200',
      purple: 'bg-purple-50 border-purple-200',
      orange: 'bg-orange-50 border-orange-200',
      red: 'bg-red-50 border-red-200',
      gray: 'bg-gray-50 border-gray-200',
      indigo: 'bg-indigo-50 border-indigo-200',
      teal: 'bg-teal-50 border-teal-200'
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const quickActions = getRoleSpecificQuickActions();
  const statsCards = getStatsCards();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{getGreeting()}</h1>
            <p className="text-blue-100 mt-1">
              Welcome to your {userRole} dashboard. Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-blue-100">Today</p>
              <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
            </div>
            <GraduationCap className="h-12 w-12 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.href}
                className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${getBgColorClasses(action.color)}`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-6 w-6 text-${action.color}-600`} />
                  <span className={`font-medium text-${action.color}-700`}>{action.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link to="/notifications" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {activity.type === 'enrollment' && <BookOpen className="h-5 w-5 text-blue-500" />}
                  {activity.type === 'completion' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {activity.type === 'reminder' && <Clock className="h-5 w-5 text-yellow-500" />}
                  {activity.type === 'creation' && <Plus className="h-5 w-5 text-purple-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Seminars or Role-specific Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {userRole === 'student' ? 'Available Seminars' : 'Quick Links'}
            </h2>
            <Link 
              to={userRole === 'student' ? '/seminars' : '/schedule'} 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          
          {userRole === 'student' ? (
            <div className="space-y-4">
              {upcomingSeminars.map((seminar, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">{seminar.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{seminar.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">{seminar.date}</span>
                    <Link
                      to={`/seminars/${seminar.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      View Details <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <Link to="/messages" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <MessageSquare className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-900">Messages</span>
              </Link>
              <Link to="/notifications" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-900">Notifications</span>
              </Link>
              <Link to="/schedule" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <Calendar className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-900">Calendar</span>
              </Link>
              <Link to="/settings" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <Settings className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-900">Settings</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Role-specific Information Panel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {userRole === 'student' && 'Academic Progress'}
          {userRole === 'teacher' && 'Teaching Overview'}
          {userRole === 'counselor' && 'Student Support Overview'}
          {userRole === 'admin' && 'System Overview'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userRole === 'student' && (
            <>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">85%</div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">4.2</div>
                <div className="text-sm text-gray-600">GPA</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">24</div>
                <div className="text-sm text-gray-600">Credits Earned</div>
              </div>
            </>
          )}
          
          {userRole === 'teacher' && (
            <>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">4.7</div>
                <div className="text-sm text-gray-600">Avg Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">156</div>
                <div className="text-sm text-gray-600">Students Taught</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">12</div>
                <div className="text-sm text-gray-600">Active Seminars</div>
              </div>
            </>
          )}
          
          {userRole === 'counselor' && (
            <>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">45</div>
                <div className="text-sm text-gray-600">Active Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">94%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">8</div>
                <div className="text-sm text-gray-600">Appointments Today</div>
              </div>
            </>
          )}
          
          {userRole === 'admin' && (
            <>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">1,247</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">99.9%</div>
                <div className="text-sm text-gray-600">System Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">+12%</div>
                <div className="text-sm text-gray-600">Monthly Growth</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;

