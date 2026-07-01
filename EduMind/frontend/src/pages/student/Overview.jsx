import React, { useEffect, useState } from 'react';
import { BookOpen, CalendarClock, AlertTriangle } from 'lucide-react';
import * as studentApi from '../../api/student.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import RadialGauge from '../../components/common/RadialGauge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { formatDate } from '../../utils.js';
import { ROLE_THEME } from '../../theme.js';

const ACCENT = ROLE_THEME.student.accent;

export default function StudentOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getOverview().then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;
  if (!data) return null;

  const lowAttendance = data.overallAttendance < 75;

  return (
    <div>
      <PageHeader title="Overview" subtitle="Your academic snapshot for this term." />

      {lowAttendance && (
        <div className="mb-5 flex items-start gap-2.5 rounded-card border border-danger/30 bg-danger/5 p-4">
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-danger" />
          <div>
            <p className="text-sm font-medium text-danger">Your attendance is below 75%</p>
            <p className="text-xs text-danger/80">Check the Attendance page to see which subjects need attention.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card flex flex-col items-center justify-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/50">Overall attendance</p>
          <RadialGauge value={data.overallAttendance} size={130} stroke={10} accent={ACCENT} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatCard icon={BookOpen} label="Enrolled subjects" value={data.subjectCount} accent={ACCENT} />
          <StatCard icon={CalendarClock} label="Upcoming exams" value={data.upcomingExams.length} accent={ACCENT} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/50">Upcoming exams</p>
          {data.upcomingExams.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No exams scheduled" message="You're all caught up — nothing on the calendar yet." />
          ) : (
            <ul className="divide-y divide-slate">
              {data.upcomingExams.map((ex) => (
                <li key={ex.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-ink">{ex.subjectName}</p>
                    <p className="text-xs text-ink/45">{ex.subjectCode}</p>
                  </div>
                  <div className="text-right text-xs text-ink/55">
                    <p>{formatDate(ex.exam_date)}</p>
                    <p>{ex.start_time}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/50">Recent marks</p>
          {data.recentMarks.length === 0 ? (
            <EmptyState icon={BookOpen} title="No marks yet" message="Marks will appear here once your faculty enters them." />
          ) : (
            <ul className="divide-y divide-slate">
              {data.recentMarks.map((m, i) => (
                <li key={i} className="flex items-center justify-between py-2.5">
                  <p className="text-sm font-medium text-ink">{m.subjectName}</p>
                  <p className="text-xs text-ink/55">
                    {m.exam_type === 'internal' ? `Internal: ${m.internal_marks ?? '—'}` : `Final: ${m.exam_marks ?? '—'}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
