import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, BookOpen, CheckSquare, Award, Search, List } from 'lucide-react';

const StudentDashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Student Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Browse Seminars */}
          <Link 
            to="/student/browse-seminars" 
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Browse Seminars</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Search and explore available seminars to enroll in.
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* My Schedule */}
          <Link 
            to="/student/schedule" 
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">My Schedule</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    View your seminar schedule organized by date and time.
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* My Enrollments */}
          <Link 
            to="/student/enrollments" 
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <List className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">My Enrollments</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Manage your current seminar enrollments.
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* My Attendance */}
          <Link 
            to="/student/attendance" 
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckSquare className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">My Attendance</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    View your attendance history and records.
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* My Credits/Progress */}
          <Link 
            to="/student/credits" 
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">My Credits & Progress</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Track your earned credits and academic progress.
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;

