import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getStudentSchedule, 
  getStudentEnrollments, 
  getStudentCredits, 
  getStudentNotifications,
  getStudentAttendance 
} from '../../lib/firebase';
import ScheduleWidget from './ScheduleWidget';
import EnrollmentWidget from './EnrollmentWidget';
import CreditProgressWidget from './CreditProgressWidget';
import NotificationCenter from './NotificationCenter';
import QuickActions from './QuickActions';
import { Calendar, BookOpen, Award, Bell, Clock, TrendingUp } from 'lucide-react';

const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    schedule: [],
    enrollments: [],
    credits: { totalCredits: 0, creditsByType: {} },
    notifications: [],
    attendance: [],
    stats: {
      enrolledClasses: 0,
      completedClasses: 0,
      upcomingEvents: 0,
      totalCredits: 0,
      attendanceRate: 0
    }
  });

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dashboard data in parallel
      const [schedule, enrollments, credits, notifications, attendance] = await Promise.all([
        getStudentSchedule(currentUser.uid),
        getStudentEnrollments(currentUser.uid),
        getStudentCredits(currentUser.uid),
        getStudentNotifications(currentUser.uid, { unreadOnly: false }),
        getStudentAttendance(currentUser.uid)
      ]);

      // Calculate statistics
      const enrolledClasses = enrollments.filter(e => e.status === 'enrolled').length;
      const completedClasses = enrollments.filter(e => e.status === 'completed').length;
      const upcomingEvents = schedule.filter(s => {
        if (s.type === 'appointment') {
          return new Date(s.startTime.toDate()) > new Date();
        }
        return true; // Classes are ongoing
      }).length;

      // Calculate attendance rate
      const totalAttendance = attendance.length;
      const presentCount = attendance.filter(a => a.status === 'present').length;
      const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

      setDashboardData({
        schedule,
        enrollments,
        credits,
        notifications,
        attendance,
        stats: {
          enrolledClasses,
          completedClasses,
          upcomingEvents,
          totalCredits: credits.totalCredits,
          attendanceRate: Math.round(attendanceRate)
        }
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {currentUser?.displayName?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your academic journey today.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter notifications={dashboardData.notifications} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Enrolled Classes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData.stats.enrolledClasses}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData.stats.completedClasses}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Upcoming Events</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData.stats.upcomingEvents}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Award className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Credits</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData.stats.totalCredits}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData.stats.attendanceRate}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Schedule and Enrollments */}
          <div className="lg:col-span-2 space-y-8">
            {/* Schedule Widget */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    Today's Schedule
                  </h2>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View Full Calendar
                  </button>
                </div>
              </div>
              <div className="p-6">
                <ScheduleWidget schedule={dashboardData.schedule} />
              </div>
            </div>

            {/* Enrollment Status */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                  My Enrollments
                </h2>
              </div>
              <div className="p-6">
                <EnrollmentWidget enrollments={dashboardData.enrollments} />
              </div>
            </div>
          </div>

          {/* Right Column - Progress and Notifications */}
          <div className="space-y-8">
            {/* Credit Progress */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-600" />
                  Credit Progress
                </h2>
              </div>
              <div className="p-6">
                <CreditProgressWidget credits={dashboardData.credits} />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-purple-600" />
                  Recent Activity
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        notification.read ? 'bg-gray-300' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.createdAt?.toDate?.()?.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {dashboardData.notifications.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Progress Summary */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Academic Progress
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {dashboardData.stats.completedClasses > 0 
                        ? Math.round((dashboardData.stats.completedClasses / (dashboardData.stats.enrolledClasses + dashboardData.stats.completedClasses)) * 100)
                        : 0}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Attendance Rate</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {dashboardData.stats.attendanceRate}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Credits Earned</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {dashboardData.stats.totalCredits} credits
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress to Graduation</span>
                      <span>{Math.min(Math.round((dashboardData.stats.totalCredits / 24) * 100), 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((dashboardData.stats.totalCredits / 24) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.max(24 - dashboardData.stats.totalCredits, 0)} credits remaining
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

