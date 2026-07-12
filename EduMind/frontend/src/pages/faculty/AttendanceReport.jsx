import React, { useEffect, useState, useCallback } from 'react';
import { History, Search } from 'lucide-react';
import * as facultyApi from '../../api/faculty.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { errMsg, todayISO } from '../../utils.js';

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function percentTone(pct) {
  if (pct == null) return 'text-ink/40';
  if (pct >= 75) return 'text-success';
  if (pct >= 50) return 'text-warn';
  return 'text-danger';
}

/**
 * Read-only attendance history. Faculty can look back over any date range
 * (including dates outside the editable window) but can never change
 * anything here — this page has no save/edit action at all.
 */
export default function FacultyAttendanceReport() {
  const { push } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(todayISO());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    facultyApi.getMySubjects().then((res) => {
      setSubjects(res.data);
      if (res.data.length > 0) setSubjectId(String(res.data[0].id));
    });
  }, []);

  const load = useCallback(() => {
    if (!subjectId || !from || !to) return;
    setLoading(true);
    facultyApi.getAttendanceReport(subjectId, from, to)
      .then((res) => setReport(res.data))
      .catch((err) => push(errMsg(err), 'error'))
      .finally(() => setLoading(false));
  }, [subjectId, from, to, push]);

  useEffect(load, [load]);

  const filteredStudents = (report?.students || []).filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.student_no.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Attendance Report" subtitle="View-only attendance history — nothing here can be edited." />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Subject</label>
          <select className="input max-w-[240px]" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">From</label>
          <input className="input max-w-[160px]" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input className="input max-w-[160px]" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <label className="label">Search student</label>
          <Search size={14} className="pointer-events-none absolute left-3 top-[38px] text-ink/30" />
          <input
            className="input pl-8"
            placeholder="Name or student no."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : !report || report.totalSessions === 0 ? (
        <EmptyState icon={History} title="No attendance recorded" message="No sessions were found for this subject in the selected date range." />
      ) : (
        <>
          <p className="mb-3 text-sm text-ink/50">
            {report.subjectCode} — {report.subjectName} · {report.totalSessions} session{report.totalSessions === 1 ? '' : 's'} between {report.from} and {report.to}
          </p>
          <div className="card overflow-x-auto p-0">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Present</th>
                  <th>Late</th>
                  <th>Absent</th>
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.studentId}>
                    <td className="font-mono text-xs">{s.student_no}</td>
                    <td className="font-medium">{s.name}</td>
                    <td>{s.present}</td>
                    <td>{s.late}</td>
                    <td>{s.absent}</td>
                    <td className={`font-semibold ${percentTone(s.percentage)}`}>
                      {s.percentage == null ? '—' : `${s.percentage}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
