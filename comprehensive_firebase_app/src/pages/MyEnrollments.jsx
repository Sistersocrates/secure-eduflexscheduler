import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { getStudentEnrollments } from '../lib/firebase';
import { GraduationCap } from 'lucide-react';

const statusColors = {
  enrolled: 'bg-green-100 text-green-800',
  waitlisted: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  dropped: 'bg-gray-100 text-gray-600'
};

const FILTERS = ['all', 'enrolled', 'waitlisted', 'completed'];

const MyEnrollments = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getStudentEnrollments(user.uid);
        setEnrollments(data || []);
      } catch (e) {
        console.error('Error loading enrollments:', e);
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user]);

  const filtered = filter === 'all' ? enrollments : enrollments.filter((e) => e.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Enrollments</h1>
        <p className="text-gray-600 mt-1">Your seminar enrollments and waitlist positions</p>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading enrollments…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <GraduationCap className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p>No {filter === 'all' ? '' : filter + ' '}enrollments.</p>
          <Link to="/seminars" className="text-blue-600 hover:underline text-sm">Browse seminars</Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {filtered.map((e) => (
            <div key={e.id} className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{e.classDetails?.title || 'Untitled class'}</p>
                <p className="text-sm text-gray-500">
                  {e.classDetails?.schedule?.days?.join(', ') || ''}
                  {e.status === 'waitlisted' && e.waitlistPosition ? ` · Waitlist position ${e.waitlistPosition}` : ''}
                </p>
              </div>
              <span className={`ml-3 shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[e.status] || 'bg-gray-100 text-gray-600'}`}>
                {e.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEnrollments;
