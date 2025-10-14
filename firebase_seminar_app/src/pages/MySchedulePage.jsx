import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, Users } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { getStudentSchedule } from '../lib/studentFunctions';

const MySchedulePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  useEffect(() => {
    if (user) {
      loadSchedule();
    }
  }, [user]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getStudentSchedule(user.uid);
      setScheduleData(data);
    } catch (err) {
      setError(err.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const HOURS = [
    { id: 1, time: "9:00 - 9:45" },
    { id: 2, time: "9:45 - 10:30" },
    { id: 3, time: "10:30 - 11:15" },
    { id: 4, time: "11:15 - 12:00" },
    { id: 5, time: "12:00 - 1:20" },
    { id: 6, time: "1:20 - 2:15" },
    { id: 7, time: "2:15 - 3:05" },
  ];

  const getHourTime = (hourId) => {
    const hour = HOURS.find(h => h.id === hourId);
    return hour ? hour.time : `Hour ${hourId}`;
  };

  // Get sorted dates
  const sortedDates = scheduleData 
    ? Object.keys(scheduleData.schedule).sort()
    : [];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
              <p className="mt-2 text-gray-600">
                View your seminar schedule organized by date and time
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-md ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Calendar View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                List View
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading schedule...</p>
          </div>
        ) : !scheduleData || scheduleData.totalEnrollments === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Yet</h3>
            <p className="text-gray-600 mb-4">
              You haven't enrolled in any seminars yet.
            </p>
            <button
              onClick={() => navigate('/student/browse-seminars')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Browse Seminars
            </button>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{scheduleData.totalEnrollments}</p>
                  <p className="text-sm text-gray-600">Total Seminars</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{sortedDates.length}</p>
                  <p className="text-sm text-gray-600">Scheduled Dates</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {Object.values(scheduleData.schedule).reduce((total, dateSchedule) => 
                      total + Object.keys(dateSchedule).length, 0
                    )}
                  </p>
                  <p className="text-sm text-gray-600">Time Slots</p>
                </div>
              </div>
            </div>

            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <div className="space-y-6">
                {sortedDates.map(date => (
                  <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Date Header */}
                    <div className="bg-blue-600 text-white px-6 py-4">
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 mr-2" />
                        <h2 className="text-xl font-semibold">{date}</h2>
                      </div>
                    </div>

                    {/* Hours for this date */}
                    <div className="p-6">
                      <div className="space-y-4">
                        {Object.keys(scheduleData.schedule[date])
                          .sort((a, b) => parseInt(a) - parseInt(b))
                          .map(hour => (
                            <div key={hour} className="border-l-4 border-blue-500 pl-4">
                              <div className="flex items-center mb-2">
                                <Clock className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="font-semibold text-gray-900">
                                  Hour {hour} - {getHourTime(parseInt(hour))}
                                </span>
                              </div>
                              
                              <div className="space-y-3">
                                {scheduleData.schedule[date][hour].map(seminar => (
                                  <div 
                                    key={seminar.id} 
                                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                                  >
                                    <h4 className="font-semibold text-gray-900 mb-2">
                                      {seminar.title}
                                    </h4>
                                    
                                    {seminar.description && (
                                      <p className="text-sm text-gray-600 mb-2">
                                        {seminar.description}
                                      </p>
                                    )}

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                      {seminar.teacherName && (
                                        <div className="flex items-center">
                                          <Users className="h-4 w-4 mr-1" />
                                          {seminar.teacherName}
                                        </div>
                                      )}
                                      {seminar.location && (
                                        <div className="flex items-center">
                                          <MapPin className="h-4 w-4 mr-1" />
                                          {seminar.location}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seminar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scheduleData.enrollments
                      .sort((a, b) => {
                        // Sort by date, then by hour
                        if (a.date !== b.date) {
                          return a.date.localeCompare(b.date);
                        }
                        return (a.hour || 0) - (b.hour || 0);
                      })
                      .map(enrollment => (
                        <tr key={enrollment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {enrollment.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            Hour {enrollment.hour} - {getHourTime(enrollment.hour)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="font-medium">{enrollment.title}</div>
                            {enrollment.description && (
                              <div className="text-gray-500 line-clamp-1">{enrollment.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {enrollment.teacherName || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {enrollment.location || '-'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MySchedulePage;

