import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { getTeacherClasses, getClassRoster, saveGrade, getClassGrades } from '../../lib/teacherFirebase';
import { FileText, Save, CheckCircle } from 'lucide-react';

const GRADE_OPTIONS = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'Pass', 'Incomplete'];

const GradingManagement = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [roster, setRoster] = useState([]);
  const [grades, setGrades] = useState({});
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getTeacherClasses(user.uid);
        setClasses(data || []);
      } catch (e) {
        console.error('Error loading classes:', e);
        setError('Could not load your classes.');
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user]);

  useEffect(() => {
    const loadRoster = async () => {
      if (!selectedClass) { setRoster([]); return; }
      try {
        setLoadingRoster(true);
        setError(null);
        const [rosterData, existingGrades] = await Promise.all([
          getClassRoster(user.uid, selectedClass),
          getClassGrades(user.uid, selectedClass)
        ]);
        setRoster(rosterData || []);
        const gradeMap = {};
        (existingGrades || []).forEach((g) => {
          gradeMap[g.studentId] = { grade: g.grade || '', feedback: g.feedback || '' };
        });
        setGrades(gradeMap);
        setSavedIds(new Set((existingGrades || []).map((g) => g.studentId)));
      } catch (e) {
        console.error('Error loading roster:', e);
        setError(e.message || 'Could not load the roster.');
      } finally {
        setLoadingRoster(false);
      }
    };
    loadRoster();
  }, [selectedClass, user]);

  const updateGrade = (studentId, field, value) => {
    setGrades((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
    setSavedIds((prev) => { const next = new Set(prev); next.delete(studentId); return next; });
  };

  const handleSave = async (studentId) => {
    const entry = grades[studentId];
    if (!entry?.grade) return;
    try {
      setBusyId(studentId);
      await saveGrade(user.uid, selectedClass, studentId, {
        grade: entry.grade,
        feedback: entry.feedback || ''
      });
      setSavedIds((prev) => new Set(prev).add(studentId));
    } catch (e) {
      setError(e.message || 'Could not save the grade.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Grading</h1>
        <p className="text-gray-600 mt-1">Assign grades and feedback for your seminars</p>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading your classes…</div>
      ) : classes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p>You don't have any classes yet.</p>
        </div>
      ) : (
        <>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 max-w-md w-full"
          >
            <option value="">Choose a class to grade…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.title || 'Untitled class'}</option>
            ))}
          </select>

          {loadingRoster ? (
            <div className="text-center py-12 text-gray-500">Loading roster…</div>
          ) : selectedClass && roster.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No enrolled students in this class yet.</div>
          ) : roster.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              {roster.map((entry) => {
                const sid = entry.student?.id || entry.studentId;
                const g = grades[sid] || { grade: '', feedback: '' };
                const saved = savedIds.has(sid);
                return (
                  <div key={sid} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="md:w-1/4 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{entry.student?.displayName || entry.student?.email || 'Student'}</p>
                      <p className="text-xs text-gray-500">{entry.student?.gradeLevel ? `Grade ${entry.student.gradeLevel}` : ''}</p>
                    </div>
                    <select
                      value={g.grade}
                      onChange={(e) => updateGrade(sid, 'grade', e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                    >
                      <option value="">Grade…</option>
                      {GRADE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <input
                      type="text"
                      value={g.feedback}
                      onChange={(e) => updateGrade(sid, 'feedback', e.target.value)}
                      placeholder="Feedback (optional)"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                    />
                    <button
                      onClick={() => handleSave(sid)}
                      disabled={!g.grade || busyId === sid || saved}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                        saved ? 'bg-green-50 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                      }`}
                    >
                      {saved ? <><CheckCircle className="h-4 w-4" /> Saved</> : busyId === sid ? 'Saving…' : <><Save className="h-4 w-4" /> Save</>}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default GradingManagement;
