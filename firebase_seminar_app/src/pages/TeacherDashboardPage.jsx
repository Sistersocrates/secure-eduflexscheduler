import React from 'react';
import { Link } from 'react-router-dom';

const TeacherDashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Teacher Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/teacher/create-seminar" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900">Create Seminar</h3>
              <p className="mt-2 text-sm text-gray-500">Create and configure new seminars.</p>
            </div>
          </Link>
          <Link to="/teacher/attendance" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900">Attendance</h3>
              <p className="mt-2 text-sm text-gray-500">Take and manage student attendance.</p>
            </div>
          </Link>
          <Link to="/teacher/rosters" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900">Rosters</h3>
              <p className="mt-2 text-sm text-gray-500">View and manage class rosters.</p>
            </div>
          </Link>
          <Link to="/teacher/student-credits" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900">Student Credits</h3>
              <p className="mt-2 text-sm text-gray-500">Manage and transfer student credits.</p>
            </div>
          </Link>
          <Link to="/teacher/advisory-students" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900">Advisory Students</h3>
              <p className="mt-2 text-sm text-gray-500">View and manage your advisory students.</p>
            </div>
          </Link>
          <Link to="/teacher/transportation" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900">Transportation</h3>
              <p className="mt-2 text-sm text-gray-500">Request transportation for seminars.</p>
            </div>
          </Link>
          <Link to="/teacher/funding" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900">Funding</h3>
              <p className="mt-2 text-sm text-gray-500">Request funding for seminar materials.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
