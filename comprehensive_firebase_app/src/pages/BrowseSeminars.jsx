import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { getAvailableClasses, getStudentEnrollments, enrollInClass } from '../lib/firebase';
import { BookOpen, Search, Users, CheckCircle, Clock } from 'lucide-react';

const BrowseSeminars = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [available, enrollments] = await Promise.all([
          getAvailableClasses(),
          getStudentEnrollments(user.uid)
        ]);
        setClasses(available || []);
        setMyEnrollments(enrollments || []);
      } catch (e) {
        console.error('Error loading seminars:', e);
        setMessage({ type: 'error', text: 'Could not load seminars. Please try again.' });
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user]);

  const enrolledClassIds = new Set(myEnrollments.map((e) => e.classId));

  const handleEnroll = async (classId) => {
    try {
      setBusyId(classId);
      setMessage(null);
      const result = await enrollInClass(user.uid, classId);
      setMyEnrollments((prev) => [...prev, result]);
      setMessage({
        type: 'success',
        text: result.status === 'enrolled'
          ? 'Enrolled successfully!'
          : `Class is full — you were added to the waitlist (position ${result.waitlistPosition}).`
      });
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Enrollment failed.' });
    } finally {
      setBusyId(null);
    }
  };

  const filtered = classes.filter((c) =>
    (c.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading seminars…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse Seminars</h1>
        <p className="text-gray-600 mt-1">Discover and enroll in available seminars</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search seminars…"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p>No seminars found{search ? ' for that search' : ' yet'}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const spotsLeft = Math.max((c.capacity || 0) - (c.currentEnrollment || 0), 0);
            const already = enrolledClassIds.has(c.id);
            return (
              <div key={c.id} className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col">
                <h3 className="font-semibold text-gray-900">{c.title || 'Untitled seminar'}</h3>
                <p className="text-sm text-gray-600 mt-1 flex-1 line-clamp-3">{c.description || 'No description provided.'}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                  <Users className="h-4 w-4" />
                  {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full — waitlist available'}
                  {c.schedule?.days?.length ? (
                    <>
                      <Clock className="h-4 w-4 ml-2" />
                      {c.schedule.days.join(', ')}
                    </>
                  ) : null}
                </div>
                <button
                  onClick={() => handleEnroll(c.id)}
                  disabled={already || busyId === c.id}
                  className={`mt-4 w-full py-2 rounded-lg text-sm font-medium ${
                    already
                      ? 'bg-green-50 text-green-700 cursor-default'
                      : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60'
                  }`}
                >
                  {already ? (
                    <span className="inline-flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Enrolled</span>
                  ) : busyId === c.id ? 'Enrolling…' : spotsLeft > 0 ? 'Enroll' : 'Join Waitlist'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrowseSeminars;
