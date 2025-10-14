import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { getStudentEnrollments, unenrollFromSeminar } from '../lib/studentFunctions';

const MyEnrollmentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [unenrolling, setUnenrolling] = useState(null);
  const [confirmUnenroll, setConfirmUnenroll] = useState(null);

  useEffect(() => {
    if (user) {
      loadEnrollments();
    }
  }, [user]);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getStudentEnrollments(user.uid);
      setEnrollments(data);
    } catch (err) {
      setError(err.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async (enrollmentId) => {
    try {
      setUnenrolling(enrollmentId);
      setError('');
      setSuccessMessage('');
      
      await unenrollFromSeminar(enrollmentId, user.uid);
      
      setSuccessMessage('Successfully unenrolled from seminar');
      setConfirmUnenroll(null);
      
      // Reload enrollments
      await loadEnrollments();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to unenroll from seminar');
    } finally {
      setUnenrolling(null);
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

  // Group enrollments by status
  const activeEnrollments = enrollments.filter(e => e.status !== 'cancelled' && e.seminar);
  const pastEnrollments = enrollments.filter(e => e.status === 'cancelled' || !e.seminar);

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
          <h1 className="text-3xl font-bold text-gray-900">My Enrollments</h1>
          <p className="mt-2 text-gray-600">
            Manage your seminar enrollments
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading enrollments...</p>
          </div>
        ) : (
          <>
            {/* Active Enrollments */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Active Enrollments ({activeEnrollments.length})
              </h2>

              {activeEnrollments.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Enrollments</h3>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeEnrollments.map(enrollment => (
                    <div key={enrollment.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                      {/* Seminar Image */}
                      {enrollment.seminar.image_url && (
                        <img
                          src={enrollment.seminar.image_url}
                          alt={enrollment.seminar.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      )}
                      
                      <div className="p-5">
                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {enrollment.seminar.title}
                        </h3>

                        {/* Description */}
                        {enrollment.seminar.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {enrollment.seminar.description}
                          </p>
                        )}

                        {/* Details */}
                        <div className="space-y-2 mb-4">
                          {enrollment.seminar.teacherName && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>{enrollment.seminar.teacherName}</span>
                            </div>
                          )}

                          {enrollment.seminar.date && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>{enrollment.seminar.date}</span>
                            </div>
                          )}

                          {enrollment.seminar.hour && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>Hour {enrollment.seminar.hour} - {getHourTime(enrollment.seminar.hour)}</span>
                            </div>
                          )}

                          {enrollment.seminar.location && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>{enrollment.seminar.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Enrollment Date */}
                        {enrollment.enrolledAt && (
                          <p className="text-xs text-gray-500 mb-4">
                            Enrolled: {new Date(enrollment.enrolledAt.seconds * 1000).toLocaleDateString()}
                          </p>
                        )}

                        {/* Unenroll Button */}
                        {confirmUnenroll === enrollment.id ? (
                          <div className="space-y-2">
                            <p className="text-sm text-red-600 font-medium">
                              Are you sure you want to unenroll?
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUnenroll(enrollment.id)}
                                disabled={unenrolling === enrollment.id}
                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-red-400"
                              >
                                {unenrolling === enrollment.id ? 'Unenrolling...' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setConfirmUnenroll(null)}
                                disabled={unenrolling === enrollment.id}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmUnenroll(enrollment.id)}
                            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2 px-4 rounded-md hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Unenroll
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Stats */}
            {activeEnrollments.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{activeEnrollments.length}</p>
                    <p className="text-sm text-gray-600">Total Enrollments</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {new Set(activeEnrollments.map(e => e.seminar.date)).size}
                    </p>
                    <p className="text-sm text-gray-600">Unique Dates</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">
                      {new Set(activeEnrollments.map(e => e.seminar.hour)).size}
                    </p>
                    <p className="text-sm text-gray-600">Different Hours</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyEnrollmentsPage;

