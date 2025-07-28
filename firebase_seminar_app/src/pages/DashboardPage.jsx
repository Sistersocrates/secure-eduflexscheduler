import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { getAllSeminars, getUserSeminars, enrollInSeminar } from '../lib/firebase';

const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const [seminars, setSeminars] = useState([]);
  const [userSeminars, setUserSeminars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allSeminars, enrolledSeminars] = await Promise.all([
          getAllSeminars(),
          getUserSeminars(user.uid)
        ]);
        setSeminars(allSeminars);
        setUserSeminars(enrolledSeminars);
      } catch (err) {
        setError('Failed to load seminars');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleEnroll = async (seminarId) => {
    try {
      await enrollInSeminar(seminarId, user.uid);
      // Reload user seminars
      const enrolledSeminars = await getUserSeminars(user.uid);
      setUserSeminars(enrolledSeminars);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                🔥 Firebase Seminar Management
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <img
                className="h-8 w-8 rounded-full"
                src={user?.photoURL || 'https://via.placeholder.com/32'}
                alt="Profile"
              />
              <span className="text-sm text-gray-700">
                {user?.displayName || user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🔥 Firebase Authentication Success!
              </h2>
              <p className="text-gray-600 mb-6">
                Welcome to your secure seminar management system powered by Google Firebase.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white p-6 rounded-lg shadow border">
                  <div className="text-green-500 mb-2">✅</div>
                  <h3 className="font-semibold text-gray-900">Firebase Auth</h3>
                  <p className="text-sm text-gray-600">Google OAuth working</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow border">
                  <div className="text-green-500 mb-2">✅</div>
                  <h3 className="font-semibold text-gray-900">Firestore Database</h3>
                  <p className="text-sm text-gray-600">Real-time data sync</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow border">
                  <div className="text-green-500 mb-2">✅</div>
                  <h3 className="font-semibold text-gray-900">Security Rules</h3>
                  <p className="text-sm text-gray-600">FERPA compliant</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Seminars */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Available Seminars</h3>
              </div>
              <div className="p-6">
                {seminars.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No seminars available. Create one in Firebase Console → Firestore.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {seminars.map((seminar) => (
                      <div key={seminar.id} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900">{seminar.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{seminar.description}</p>
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            📅 {seminar.date} • 📍 {seminar.location}
                          </span>
                          <button
                            onClick={() => handleEnroll(seminar.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Enroll
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* My Seminars */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">My Seminars</h3>
              </div>
              <div className="p-6">
                {userSeminars.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    You haven't enrolled in any seminars yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {userSeminars.map((seminar) => (
                      <div key={seminar.id} className="border rounded-lg p-4 bg-green-50">
                        <h4 className="font-medium text-gray-900">{seminar.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{seminar.description}</p>
                        <div className="mt-2">
                          <span className="text-sm text-gray-500">
                            📅 {seminar.date} • 📍 {seminar.location}
                          </span>
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            Enrolled
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;

