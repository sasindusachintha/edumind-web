import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ClipboardCheck, Save, QrCode, RefreshCw } from 'lucide-react';
import * as facultyApi from '../../api/faculty.js';
import * as attendanceApi from '../../api/attendance.js';
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

function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return 'Expired';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FacultyAttendance() {
  const { push } = useToast();
  const [mode, setMode] = useState('manual'); // 'manual' | 'qr'
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- QR attendance state ---
  const [classLabel, setClassLabel] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [qrSession, setQrSession] = useState(null); // { qrImage, scanUrl, subjectName, expiresAt, ... }
  const [generating, setGenerating] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null);

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

  // Live countdown for the active QR session.
  useEffect(() => {
    if (!qrSession) return undefined;
    const tick = () => {
      const remaining = Math.max(0, Math.round((new Date(qrSession.expiresAt) - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [qrSession]);

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

  async function handleGenerateQr() {
    if (!subjectId || !date) {
      push('Choose a subject and date first.', 'error');
      return;
    }
    setGenerating(true);
    try {
      const { data } = await attendanceApi.createAttendanceSession({
        subjectId,
        classLabel: classLabel || undefined,
        sessionDate: date,
        durationMinutes
      });
      setQrSession(data);
      push('Attendance QR generated.');
    } catch (err) {
      push(errMsg(err), 'error');
    } finally {
      setGenerating(false);
    }
  }

  const expired = qrSession && secondsLeft <= 0;

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Mark attendance manually, or generate a QR code students can scan."
        actions={
          mode === 'manual' && rows.length > 0 && (
            <button className="btn-primary-faculty" onClick={handleSave} disabled={saving}>
              <Save size={15} /> {saving ? 'Saving…' : 'Save attendance'}
            </button>
          )
        }
      />

      <div className="mb-4 flex gap-1.5">
        <button
          className={`rounded-md border px-3 py-1.5 text-xs font-medium ${mode === 'manual' ? 'border-faculty bg-faculty-soft text-faculty' : 'border-slate text-ink/50 hover:bg-paper'}`}
          onClick={() => setMode('manual')}
        >
          Manual
        </button>
        <button
          className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium ${mode === 'qr' ? 'border-faculty bg-faculty-soft text-faculty' : 'border-slate text-ink/50 hover:bg-paper'}`}
          onClick={() => setMode('qr')}
        >
          <QrCode size={13} /> QR Code
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select className="input max-w-[240px]" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
        </select>
        <input className="input max-w-[180px]" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        {mode === 'manual' && rows.length > 0 && (
          <div className="flex gap-1.5">
            <button className="btn-ghost text-xs" onClick={() => markAll('present')}>Mark all present</button>
            <button className="btn-ghost text-xs" onClick={() => markAll('absent')}>Mark all absent</button>
          </div>
        )}
      </div>

      {mode === 'qr' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="card">
            <p className="mb-3 text-sm font-medium text-ink">Generate Attendance QR</p>
            <div className="space-y-3">
              <div>
                <label className="label">Class / Batch (optional)</label>
                <input
                  className="input"
                  placeholder="e.g. Batch A, Morning session"
                  value={classLabel}
                  onChange={(e) => setClassLabel(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Attendance duration (minutes)</label>
                <input
                  className="input max-w-[140px]"
                  type="number"
                  min={1}
                  max={60}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                />
              </div>
              <button className="btn-primary-faculty w-full" onClick={handleGenerateQr} disabled={generating}>
                <QrCode size={15} /> {generating ? 'Generating…' : 'Generate Attendance QR'}
              </button>
            </div>
          </div>

          <div className="card flex flex-col items-center justify-center text-center">
            {!qrSession ? (
              <EmptyState icon={QrCode} title="No active QR session" message="Generate a QR code for students to scan and mark attendance." />
            ) : (
              <>
                <p className="text-sm font-medium text-ink">{qrSession.subjectCode} — {qrSession.subjectName}</p>
                <img src={qrSession.qrImage} alt="Attendance QR code" className="my-4 h-56 w-56 rounded-md border border-slate" />
                <p className={`text-sm font-semibold ${expired ? 'text-danger' : 'text-faculty'}`}>
                  {expired ? 'QR expired' : `Expires in ${formatCountdown(secondsLeft)}`}
                </p>
                <button className="btn-ghost mt-3 text-xs" onClick={handleGenerateQr} disabled={generating}>
                  <RefreshCw size={13} /> Generate new QR
                </button>
              </>
            )}
          </div>
        </div>
      ) : loading ? (
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
