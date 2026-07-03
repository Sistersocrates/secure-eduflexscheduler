import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, GraduationCap, UserCheck } from 'lucide-react';

const actions = [
  { name: 'Browse Seminars', href: '/seminars', icon: BookOpen, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { name: 'View Schedule', href: '/schedule', icon: Calendar, color: 'text-green-600 bg-green-50 border-green-200' },
  { name: 'My Enrollments', href: '/enrollments', icon: GraduationCap, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { name: 'Book Appointment', href: '/appointments', icon: UserCheck, color: 'text-orange-600 bg-orange-50 border-orange-200' }
];

const QuickActions = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {actions.map(({ name, href, icon: Icon, color }) => (
      <Link
        key={href}
        to={href}
        className={`flex items-center gap-2 p-3 rounded-lg border ${color} hover:opacity-80 transition-opacity`}
      >
        <Icon className="h-5 w-5" />
        <span className="text-sm font-medium">{name}</span>
      </Link>
    ))}
  </div>
);

export default QuickActions;
