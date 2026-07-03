import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { getAvailableSpecialists, requestAppointment } from '../lib/firebase';
import { UserCheck } from 'lucide-react';

const BookAppointment = () => {
  const { user, userProfile } = useAuth();
  const [specialists, setSpecialists] = useState([]);
  const [form, setForm] = useState({ specialistId: '', date: '', time: '', reason: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAvailableSpecialists();
        setSpecialists(data || []);
      } catch (e) {
        console.error('Error loading specialists:', e);
        setMessage({ type: 'error', text: 'Could not load counselors. Please try again.' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.specialistId || !form.date || !form.time) {
      setMessage({ type: 'error', text: 'Please choose a counselor, date, and time.' });
      return;
    }
    try {
      setSubmitting(true);
      setMessage(null);
      const startTime = new Date(`${form.date}T${form.time}`);
      await requestAppointment({
        studentId: user.uid,
        studentName: userProfile?.displayName || user.displayName || '',
        specialistId: form.specialistId,
        startTime,
        reason: form.reason || 'General counseling'
      });
      setMessage({ type: 'success', text: 'Appointment requested! Your counselor will confirm it soon.' });
      setForm({ specialistId: '', date: '', time: '', reason: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not request the appointment.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book an Appointment</h1>
        <p className="text-gray-600 mt-1">Request time with a counselor or specialist</p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading counselors…</div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Counselor</label>
            <select
              value={form.specialistId}
              onChange={(e) => setForm({ ...form, specialistId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a counselor…</option>
              {specialists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName || s.email || 'Counselor'}{s.specialization ? ` — ${s.specialization}` : ''}
                </option>
              ))}
            </select>
            {specialists.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No counselors are registered yet.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={3}
              placeholder="What would you like to talk about?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            <UserCheck className="h-5 w-5" />
            {submitting ? 'Requesting…' : 'Request Appointment'}
          </button>
        </form>
      )}
    </div>
  );
};

export default BookAppointment;
