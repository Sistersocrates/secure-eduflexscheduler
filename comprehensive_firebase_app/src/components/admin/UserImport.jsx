import React, { useState, useEffect, useRef } from 'react';
import {
  importRoster,
  getRosterEntries,
  removeRosterEntry,
  getAccessControlSettings,
  saveAccessControlSettings
} from '../../lib/adminFirebase';
import { Upload, Users, Shield, Save, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

const VALID_ROLES = { student: 'student', teacher: 'teacher', counselor: 'specialist', specialist: 'specialist', admin: 'admin', office: 'admin' };

// Small CSV parser that handles quoted fields
const parseCSV = (text) => {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (field || row.length) { row.push(field); rows.push(row); row = []; field = ''; }
      if (c === '\r' && text[i + 1] === '\n') i++;
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim()));
};

const UserImport = () => {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [roster, setRoster] = useState([]);
  const [settings, setSettings] = useState({ allowedDomains: [], enforceRoster: true });
  const [domainsText, setDomainsText] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [error, setError] = useState(null);

  const loadRoster = async () => {
    try {
      const entries = await getRosterEntries();
      setRoster(entries.sort((a, b) => (a.email > b.email ? 1 : -1)));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const ac = await getAccessControlSettings();
        setSettings(ac);
        setDomainsText((ac.allowedDomains || []).join(', '));
      } catch (e) { console.error(e); }
      loadRoster();
    };
    load();
  }, []);

  const handleFile = async (e) => {
    setError(null);
    setImportResult(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length < 2) {
      setError('The CSV needs a header row plus at least one person.');
      return;
    }
    const headers = rows[0].map((h) => h.toLowerCase().trim());
    const emailIdx = headers.findIndex((h) => h.includes('email') && !h.includes('teacher'));
    const nameIdx = headers.findIndex((h) => h.includes('name'));
    const roleIdx = headers.findIndex((h) => h.includes('role') || h.includes('type'));
    const gradeIdx = headers.findIndex((h) => h.includes('grade'));
    const idIdx = headers.findIndex((h) => h.includes('student id') || h === 'id' || h.includes('student_id'));

    if (emailIdx === -1) {
      setError('Could not find an "email" column. Expected headers like: name, email, role.');
      return;
    }

    const entries = [];
    const errs = [];
    rows.slice(1).forEach((r, i) => {
      const email = (r[emailIdx] || '').trim().toLowerCase();
      const rawRole = (roleIdx >= 0 ? r[roleIdx] : 'student').trim().toLowerCase() || 'student';
      const role = VALID_ROLES[rawRole];
      if (!email.includes('@')) { errs.push(`Row ${i + 2}: invalid email "${email}"`); return; }
      if (!role) { errs.push(`Row ${i + 2}: unknown role "${rawRole}" (use student, teacher, counselor, office, or admin)`); return; }
      entries.push({
        email,
        displayName: nameIdx >= 0 ? (r[nameIdx] || '').trim() : '',
        role,
        gradeLevel: gradeIdx >= 0 && r[gradeIdx] ? r[gradeIdx].trim() : null,
        studentId: idIdx >= 0 ? (r[idIdx] || '').trim() : ''
      });
    });
    setPreview(entries);
    setParseErrors(errs);
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      setError(null);
      const result = await importRoster(preview, settings.tenantId || 'default');
      setImportResult(result);
      setPreview([]);
      if (fileRef.current) fileRef.current.value = '';
      loadRoster();
    } catch (e) {
      setError(e.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      setSettingsSaved(false);
      const allowedDomains = domainsText
        .split(',')
        .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
        .filter(Boolean);
      await saveAccessControlSettings({ ...settings, allowedDomains });
      setSettings((s) => ({ ...s, allowedDomains }));
      setSettingsSaved(true);
    } catch (e) {
      setError(e.message || 'Could not save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRemove = async (email) => {
    if (!window.confirm(`Remove ${email} from the roster? They will no longer be able to register.`)) return;
    await removeRosterEntry(email);
    loadRoster();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Import & Access Control</h1>
        <p className="text-gray-600 mt-1">Upload your school roster and control who can sign in</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Access control settings */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" /> Sign-in restrictions
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Allowed email domains (comma-separated)</label>
          <input
            type="text"
            value={domainsText}
            onChange={(e) => { setDomainsText(e.target.value); setSettingsSaved(false); }}
            placeholder="rochesterschools.org"
            className="w-full max-w-lg border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty to allow any domain (roster check still applies).</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={settings.enforceRoster !== false}
            onChange={(e) => { setSettings((s) => ({ ...s, enforceRoster: e.target.checked })); setSettingsSaved(false); }}
            className="rounded border-gray-300"
          />
          Only people on the uploaded roster can create an account (recommended)
        </label>
        <button
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {settingsSaved ? <><CheckCircle className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> {savingSettings ? 'Saving…' : 'Save settings'}</>}
        </button>
      </section>

      {/* CSV upload */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Upload className="h-5 w-5 text-green-600" /> Upload roster CSV
        </h2>
        <p className="text-sm text-gray-600">
          Columns: <code className="bg-gray-100 px-1 rounded">name, email, role</code> (optional: <code className="bg-gray-100 px-1 rounded">grade, student id</code>).
          Roles: student, teacher, counselor, office, admin. Re-uploading updates existing entries.
        </p>
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="text-sm" />

        {parseErrors.length > 0 && (
          <div className="p-3 rounded-lg bg-yellow-50 text-yellow-800 text-xs space-y-1">
            {parseErrors.slice(0, 8).map((e, i) => <p key={i}>{e}</p>)}
            {parseErrors.length > 8 && <p>…and {parseErrors.length - 8} more</p>}
          </div>
        )}

        {preview.length > 0 && (
          <>
            <div className="max-h-64 overflow-auto border border-gray-100 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Name</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Email</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 50).map((p, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-3 py-1.5">{p.displayName}</td>
                      <td className="px-3 py-1.5">{p.email}</td>
                      <td className="px-3 py-1.5 capitalize">{p.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 50 && <p className="text-xs text-gray-500 p-2">…and {preview.length - 50} more</p>}
            </div>
            <button
              onClick={handleImport}
              disabled={importing}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" /> {importing ? 'Importing…' : `Import ${preview.length} people`}
            </button>
          </>
        )}

        {importResult && (
          <div className="p-3 rounded-lg bg-green-50 text-green-800 text-sm">
            Imported {importResult.successful} of {importResult.total} people.
            {importResult.failed.length > 0 && ` ${importResult.failed.length} rows were skipped.`}
          </div>
        )}
      </section>

      {/* Current roster */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" /> Current roster ({roster.length})
        </h2>
        {roster.length === 0 ? (
          <p className="text-sm text-gray-500">No one on the roster yet. Upload a CSV above.</p>
        ) : (
          <div className="max-h-80 overflow-auto border border-gray-100 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Name</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Email</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Role</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => (
                  <tr key={r.id} className="border-t border-gray-50">
                    <td className="px-3 py-1.5">{r.displayName}</td>
                    <td className="px-3 py-1.5">{r.email}</td>
                    <td className="px-3 py-1.5 capitalize">{r.role}</td>
                    <td className="px-3 py-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {r.status || 'invited'}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <button onClick={() => handleRemove(r.email)} className="text-gray-400 hover:text-red-600" title="Remove from roster">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default UserImport;
