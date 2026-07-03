import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { getStudentSchedule } from '../lib/firebase';
import ScheduleWidget from '../components/student/ScheduleWidget';

const MySchedule = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getStudentSchedule(user.uid);
        setSchedule(data || []);
      } catch (e) {
        console.error('Error loading schedule:', e);
        setError('Could not load your schedule.');
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-gray-600 mt-1">Your classes and upcoming appointments</p>
      </div>
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading schedule…</div>
      ) : error ? (
        <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm">{error}</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <ScheduleWidget schedule={schedule} />
        </div>
      )}
    </div>
  );
};

export default MySchedule;
