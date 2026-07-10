import React, { useEffect, useState, useCallback } from 'react';
import { ClipboardCheck, Save } from 'lucide-react';
import * as facultyApi from '../../api/faculty.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { errMsg, todayISO } from '../../utils.js';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', tone: 'success' },
  { value: 'late', label: 'Late', tone: 'warn' },
  { value: 'absent', label: 'Absent', tone: 'danger' }
];

const TONE_CLASSES = {
  success: 'bg-success/10 text-success border-success/30',
  warn: 'bg-warn/10 text-warn border-warn/30',
  danger: 'bg-danger/10 text-danger border-danger/30'
};

export default function FacultyAttendance() {
  const { push } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    facultyApi.getMySubjects().then((res) => {
      setSubjects(res.data);
      if (res.data.length > 0) setSubjectId(String(res.data[0].id));
    });
  }, []);

  const load = useCallback(() => {
    if (!subjectId || !date) return;
    setLoading(true);
    facultyApi.getAttendanceSession(subjectId, date)
      .then((res) => setRows(res.data.map((r) => ({ ...r, status: r.status || 'present' }))))
      .finally(() => setLoading(false));
  }, [subjectId, date]);

  useEffect(load, [load]);

  function setStatus(studentId, status) {
    setRows((rs) => rs.map((r) => (r.studentId === studentId ? { ...r, status } : r)));
  }

  function markAll(status) {
    setRows((rs) => rs.map((r) => ({ ...r, status })));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const records = rows.map((r) => ({ studentId: r.studentId, status: r.status }));
      await facultyApi.markAttendance(subjectId, date, records);
      push('Attendance saved successfully.');
    } catch (err) {
      push(errMsg(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Mark attendance for a session, then save."
        actions={
          rows.length > 0 && (
            <button className="btn-primary-faculty" onClick={handleSave} disabled={saving}>
              <Save size={15} /> {saving ? 'Saving…' : 'Save attendance'}
            </button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <select className="input max-w-[240px]" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
        </select>
        <input className="input max-w-[180px]" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        {rows.length > 0 && (
          <div className="flex gap-1.5">
            <button className="btn-ghost text-xs" onClick={() => markAll('present')}>Mark all present</button>
            <button className="btn-ghost text-xs" onClick={() => markAll('absent')}>Mark all absent</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : subjects.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No subjects assigned" message="You need a subject assignment before you can take attendance." />
      ) : rows.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No students enrolled" message="This subject has no enrolled students yet." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead><tr><th>Student ID</th><th>Name</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.studentId}>
                  <td className="font-mono text-xs">{r.student_no}</td>
                  <td className="font-medium">{r.name}</td>
                  <td>
                    <div className="flex gap-1.5">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setStatus(r.studentId, opt.value)}
                          className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                            r.status === opt.value ? TONE_CLASSES[opt.tone] : 'border-slate text-ink/45 hover:bg-paper'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
