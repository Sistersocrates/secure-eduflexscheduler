import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, Users, Clock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { getBrowseSeminars, enrollInSeminar } from '../lib/studentFunctions';

const BrowseSeminarsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seminars, setSeminars] = useState([]);
  const [filteredSeminars, setFilteredSeminars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState('');

  useEffect(() => {
    loadSeminars();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedDate, selectedHour, seminars]);

  const loadSeminars = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getBrowseSeminars();
      setSeminars(data);
      setFilteredSeminars(data);
    } catch (err) {
      setError(err.message || 'Failed to load seminars');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...seminars];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(seminar =>
        seminar.title?.toLowerCase().includes(searchLower) ||
        seminar.description?.toLowerCase().includes(searchLower) ||
        seminar.teacherName?.toLowerCase().includes(searchLower)
      );
    }

    // Date filter
    if (selectedDate) {
      filtered = filtered.filter(seminar => seminar.date === selectedDate);
    }

    // Hour filter
    if (selectedHour) {
      filtered = filtered.filter(seminar => seminar.hour === parseInt(selectedHour));
    }

    setFilteredSeminars(filtered);
  };

  const handleEnroll = async (seminarId) => {
    if (!user) {
      setError('You must be logged in to enroll');
      return;
    }

    try {
      setEnrolling(seminarId);
      setError('');
      setSuccessMessage('');
      
      await enrollInSeminar(seminarId, user.uid);
      
      setSuccessMessage('Successfully enrolled in seminar!');
      
      // Reload seminars to update availability
      await loadSeminars();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to enroll in seminar');
    } finally {
      setEnrolling(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDate('');
    setSelectedHour('');
  };

  // Get unique dates and hours for filter dropdowns
  const uniqueDates = [...new Set(seminars.map(s => s.date))].filter(Boolean).sort();
  const uniqueHours = [...new Set(seminars.map(s => s.hour))].filter(Boolean).sort((a, b) => a - b);

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
          <h1 className="text-3xl font-bold text-gray-900">Browse Seminars</h1>
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

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filter Seminars</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, description, or teacher..."
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Dates</option>
                {uniqueDates.map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            </div>

            {/* Hour Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hour
              </label>
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Hours</option>
                {uniqueHours.map(hour => (
                  <option key={hour} value={hour}>
                    Hour {hour} - {getHourTime(hour)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(searchTerm || selectedDate || selectedHour) && (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredSeminars.length} of {seminars.length} seminars
        </div>

        {/* Seminars Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading seminars...</p>
          </div>
        ) : filteredSeminars.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No seminars found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedDate || selectedHour
                ? 'Try adjusting your filters to see more results.'
                : 'There are no seminars available at this time.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSeminars.map(seminar => (
              <div key={seminar.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                {/* Seminar Image */}
                {seminar.image_url && (
                  <img
                    src={seminar.image_url}
                    alt={seminar.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                
                <div className="p-5">
                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {seminar.title}
                  </h3>

                  {/* Description */}
                  {seminar.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {seminar.description}
                    </p>
                  )}

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    {seminar.teacherName && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>Teacher: {seminar.teacherName}</span>
                      </div>
                    )}

                    {seminar.date && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{seminar.date}</span>
                      </div>
                    )}

                    {seminar.hour && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>Hour {seminar.hour} - {getHourTime(seminar.hour)}</span>
                      </div>
                    )}

                    {seminar.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{seminar.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Capacity */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Capacity</span>
                      <span>{seminar.currentEnrollment || 0} / {seminar.capacity || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          seminar.isFull ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            ((seminar.currentEnrollment || 0) / (seminar.capacity || 1)) * 100,
                            100
                          )}%`
                        }}
                      ></div>
                    </div>
                    {seminar.availableSpots > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        {seminar.availableSpots} spot{seminar.availableSpots !== 1 ? 's' : ''} available
                      </p>
                    )}
                  </div>

                  {/* Enroll Button */}
                  <button
                    onClick={() => handleEnroll(seminar.id)}
                    disabled={seminar.isFull || seminar.isLocked || enrolling === seminar.id}
                    className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                      seminar.isFull || seminar.isLocked
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : enrolling === seminar.id
                        ? 'bg-blue-400 text-white cursor-wait'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {enrolling === seminar.id
                      ? 'Enrolling...'
                      : seminar.isFull
                      ? 'Full'
                      : seminar.isLocked
                      ? 'Locked'
                      : 'Enroll'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseSeminarsPage;

