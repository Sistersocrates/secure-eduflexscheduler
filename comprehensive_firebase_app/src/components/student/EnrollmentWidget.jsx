import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';

const statusColors = {
  enrolled: 'bg-green-100 text-green-800',
  waitlisted: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  dropped: 'bg-gray-100 text-gray-600'
};

const EnrollmentWidget = ({ enrollments = [] }) => {
  if (!enrollments.length) {
    return (
      <div className="text-center py-6 text-gray-500">
        <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No enrollments yet</p>
        <Link to="/seminars" className="text-blue-600 text-sm hover:underline">
          Browse seminars to get started
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {enrollments.slice(0, 5).map((e) => (
        <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {e.classDetails?.title || 'Untitled class'}
            </p>
            <p className="text-xs text-gray-500">
              {e.classDetails?.schedule?.days?.join(', ') || ''}
            </p>
          </div>
          <span className={`ml-3 shrink-0 px-2 py-1 rounded-full text-xs font-medium ${statusColors[e.status] || 'bg-gray-100 text-gray-600'}`}>
            {e.status || 'unknown'}
          </span>
        </div>
      ))}
      {enrollments.length > 5 && (
        <Link to="/enrollments" className="flex items-center text-sm text-blue-600 hover:underline">
          View all {enrollments.length} enrollments <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
};

export default EnrollmentWidget;
