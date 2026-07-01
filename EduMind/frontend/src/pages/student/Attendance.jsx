import React, { useEffect, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import * as studentApi from '../../api/student.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import RadialGauge from '../../components/common/RadialGauge.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { formatDate } from '../../utils.js';
import { ROLE_THEME } from '../../theme.js';

const ACCENT = ROLE_THEME.student.accent;
const STATUS_TONE = { present: 'success', late: 'warn', absent: 'danger' };

export default function StudentAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getAttendance().then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;
  if (!data) return null;

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Your attendance percentage by subject." />

      {data.bySubject.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No attendance recorded" message="Once your faculty starts marking sessions, your percentage will show up here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.bySubject.map((s) => (
            <div key={s.subjectId} className="card flex flex-col items-center text-center">
              <RadialGauge value={s.percentage || 0} size={86} stroke={7} accent={ACCENT} />
              <p className="mt-2.5 text-sm font-medium text-ink">{s.subjectName}</p>
              <p className="text-xs text-ink/40">{s.attended}/{s.totalSessions} sessions</p>
            </div>
          ))}
        </div>
      )}

      <p className="mb-3 mt-7 text-xs font-medium uppercase tracking-wide text-ink/50">Recent sessions</p>
      {data.records.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No sessions yet" message="Your attendance history will appear here." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead><tr><th>Date</th><th>Subject</th><th>Status</th></tr></thead>
            <tbody>
              {data.records.map((r, i) => (
                <tr key={i}>
                  <td className="text-ink/60">{formatDate(r.date)}</td>
                  <td className="font-medium">{r.subjectName}</td>
                  <td><Badge tone={STATUS_TONE[r.status] || 'neutral'}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
