import React, { useState } from 'react';
import { MapPin, ClipboardCheck, CalendarClock } from 'lucide-react';
import StudentLocationSchedule from './StudentLocationSchedule';
import AttendanceDashboard from './AttendanceDashboard';
import MeetingScheduling from './MeetingScheduling';

const TABS = [
  {
    id: 'locator',
    name: 'Student Locator',
    description: 'See where any student is scheduled to be right now',
    icon: MapPin
  },
  {
    id: 'attendance',
    name: 'Attendance Hub',
    description: 'School-wide attendance records, filters, and exports',
    icon: ClipboardCheck
  },
  {
    id: 'counselors',
    name: 'Counselor Schedules',
    description: 'View and manage counselor meetings and appointments',
    icon: CalendarClock
  }
];

const OfficeDashboard = () => {
  const [activeTab, setActiveTab] = useState('locator');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Office Hub</h1>
        <p className="text-gray-600 mt-1">
          Student locations, attendance, and counselor schedules in one place
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Office sections">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
                title={tab.description}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      <div>
        {activeTab === 'locator' && <StudentLocationSchedule />}
        {activeTab === 'attendance' && <AttendanceDashboard />}
        {activeTab === 'counselors' && <MeetingScheduling />}
      </div>
    </div>
  );
};

export default OfficeDashboard;
