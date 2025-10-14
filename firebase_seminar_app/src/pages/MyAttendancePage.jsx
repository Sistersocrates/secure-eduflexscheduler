import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { getStudentAttendance } from '../lib/studentFunctions';

const MyAttendancePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'present', 'absent'

  useEffect(() => {
    if (user) {
      loadAttendance();
    }
  }, [user]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getStudentAttendance(user.uid);
      setAttendanceRecords(data);
    } catch (err) {
      setError(err.message || 'Failed to load attendance records');
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

  // Calculate statistics
  const totalRecords = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => 
    r.status === 'present' || r.status === 'attended'
  ).length;
  const absentCount = attendanceRecords.filter(r => 
    r.status === 'absent' || r.status === 'missed'
  ).length;
  const attendanceRate = totalRecords > 0 
    ? Math.round((presentCount / totalRecords) * 100) 
    : 0;

  // Filter records
  const filteredRecords = attendanceRecords.filter(record => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'present') {
      return record.status === 'present' || record.status === 'attended';
    }
    if (filterStatus === 'absent') {
      return record.status === 'absent' || record.status === 'missed';
    }
    return true;
  });

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || '';
    
    if (statusLower === 'present' || statusLower === 'attended') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-4 w-4 mr-1" />
          Present
        </span>
      );
    }
    
    if (statusLower === 'absent' || statusLower === 'missed') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircle className="h-4 w-4 mr-1" />
          Absent
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
        {status || 'Unknown'}
      </span>
    );
  };

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
          <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
          <p className="mt-2 text-gray-600">
            View your attendance history and records
          </p>
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
            <p className="mt-2 text-gray-600">Loading attendance records...</p>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Sessions</p>
                    <p className="text-3xl font-bold text-gray-900">{totalRecords}</p>
                  </div>
                  <Calendar className="h-10 w-10 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Present</p>
                    <p className="text-3xl font-bold text-green-600">{presentCount}</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Absent</p>
                    <p className="text-3xl font-bold text-red-600">{absentCount}</p>
                  </div>
                  <XCircle className="h-10 w-10 text-red-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Attendance Rate</p>
                    <p className="text-3xl font-bold text-blue-600">{attendanceRate}%</p>
                  </div>
                  <div className="relative h-10 w-10">
                    <svg className="transform -rotate-90 h-10 w-10">
                      <circle
                        cx="20"
                        cy="20"
                        r="18"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="18"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${attendanceRate * 1.13} ${113 - attendanceRate * 1.13}`}
                        className="text-blue-500"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-md ${
                    filterStatus === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({totalRecords})
                </button>
                <button
                  onClick={() => setFilterStatus('present')}
                  className={`px-4 py-2 rounded-md ${
                    filterStatus === 'present'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Present ({presentCount})
                </button>
                <button
                  onClick={() => setFilterStatus('absent')}
                  className={`px-4 py-2 rounded-md ${
                    filterStatus === 'absent'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Absent ({absentCount})
                </button>
              </div>
            </div>

            {/* Attendance Records */}
            {filteredRecords.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
                <p className="text-gray-600">
                  {filterStatus === 'all'
                    ? "You don't have any attendance records yet."
                    : `No ${filterStatus} records found.`}
                </p>
              </div>
            ) : (
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
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map(record => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {record.date || (record.seminar?.date) || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            {record.seminar?.hour 
                              ? `Hour ${record.seminar.hour} - ${getHourTime(record.seminar.hour)}`
                              : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">
                            {record.seminar?.title || 'Unknown Seminar'}
                          </div>
                          {record.seminar?.teacherName && (
                            <div className="text-gray-500 text-xs">
                              {record.seminar.teacherName}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getStatusBadge(record.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {record.notes || '-'}
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

export default MyAttendancePage;

