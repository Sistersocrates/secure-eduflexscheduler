import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, TrendingUp, CheckCircle, Target, Calendar } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { getStudentCredits } from '../lib/studentFunctions';

const MyCreditsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creditsData, setCreditsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadCredits();
    }
  }, [user]);

  const loadCredits = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getStudentCredits(user.uid);
      setCreditsData(data);
    } catch (err) {
      setError(err.message || 'Failed to load credits information');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percent) => {
    if (percent >= 100) return 'text-green-600';
    if (percent >= 75) return 'text-blue-600';
    if (percent >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (percent) => {
    if (percent >= 100) return 'bg-green-500';
    if (percent >= 75) return 'bg-blue-500';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
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
          <h1 className="text-3xl font-bold text-gray-900">My Credits & Progress</h1>
          <p className="mt-2 text-gray-600">
            Track your earned credits and academic progress
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
            <p className="mt-2 text-gray-600">Loading credits information...</p>
          </div>
        ) : creditsData ? (
          <>
            {/* Overall Progress Card */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 mb-6 text-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Overall Progress</h2>
                  <p className="text-blue-100">Your academic journey at a glance</p>
                </div>
                <Award className="h-16 w-16 text-white opacity-50" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <p className="text-sm text-blue-100 mb-1">Credits Earned</p>
                  <p className="text-4xl font-bold">{creditsData.creditsEarned || 0}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <p className="text-sm text-blue-100 mb-1">Required Credits</p>
                  <p className="text-4xl font-bold">{creditsData.requiredCredits || 0}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <p className="text-sm text-blue-100 mb-1">Completion</p>
                  <p className={`text-4xl font-bold ${creditsData.percentComplete >= 100 ? 'text-green-300' : ''}`}>
                    {creditsData.percentComplete || 0}%
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="w-full bg-white bg-opacity-20 rounded-full h-4">
                  <div
                    className="bg-white h-4 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(creditsData.percentComplete || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Credits</p>
                <p className="text-2xl font-bold text-gray-900">{creditsData.totalCredits || 0}</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Sessions Attended</p>
                <p className="text-2xl font-bold text-gray-900">{creditsData.attendanceCount || 0}</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 rounded-full p-3">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{creditsData.totalSessions || 0}</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-100 rounded-full p-3">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {creditsData.totalSessions > 0
                    ? Math.round((creditsData.attendanceCount / creditsData.totalSessions) * 100)
                    : 0}%
                </p>
              </div>
            </div>

            {/* Progress Details */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Progress Details</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Credits Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Credit Progress</span>
                      <span className={`text-sm font-semibold ${getProgressColor(creditsData.percentComplete || 0)}`}>
                        {creditsData.creditsEarned || 0} / {creditsData.requiredCredits || 0} credits
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(creditsData.percentComplete || 0)}`}
                        style={{ width: `${Math.min(creditsData.percentComplete || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Attendance Progress */}
                  {creditsData.totalSessions > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Attendance Progress</span>
                        <span className={`text-sm font-semibold ${
                          getProgressColor(
                            Math.round((creditsData.attendanceCount / creditsData.totalSessions) * 100)
                          )
                        }`}>
                          {creditsData.attendanceCount || 0} / {creditsData.totalSessions || 0} sessions
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            getProgressBarColor(
                              Math.round((creditsData.attendanceCount / creditsData.totalSessions) * 100)
                            )
                          }`}
                          style={{
                            width: `${Math.min(
                              Math.round((creditsData.attendanceCount / creditsData.totalSessions) * 100),
                              100
                            )}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Milestone Messages */}
                <div className="mt-6 space-y-3">
                  {creditsData.percentComplete >= 100 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <p className="text-sm font-medium text-green-800">
                          Congratulations! You've completed your required credits!
                        </p>
                      </div>
                    </div>
                  )}

                  {creditsData.percentComplete >= 75 && creditsData.percentComplete < 100 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                        <p className="text-sm font-medium text-blue-800">
                          Great progress! You're almost there - keep it up!
                        </p>
                      </div>
                    </div>
                  )}

                  {creditsData.percentComplete >= 50 && creditsData.percentComplete < 75 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Target className="h-5 w-5 text-yellow-600 mr-2" />
                        <p className="text-sm font-medium text-yellow-800">
                          You're halfway there! Keep attending seminars to reach your goal.
                        </p>
                      </div>
                    </div>
                  )}

                  {creditsData.percentComplete < 50 && creditsData.requiredCredits > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Award className="h-5 w-5 text-red-600 mr-2" />
                        <p className="text-sm font-medium text-red-800">
                          You need {creditsData.requiredCredits - creditsData.creditsEarned} more credits to reach your goal.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Seminar Credits Breakdown */}
            {creditsData.seminarCredits && creditsData.seminarCredits.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Credits by Seminar</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seminar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Credits Earned
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {creditsData.seminarCredits.map((seminar, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {seminar.title || 'Unknown Seminar'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {seminar.credits || 0}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              seminar.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {seminar.status || 'In Progress'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Credit Information Available</h3>
            <p className="text-gray-600">
              Your credit information will appear here once you start attending seminars.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCreditsPage;

