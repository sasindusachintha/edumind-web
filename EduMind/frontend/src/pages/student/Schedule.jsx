import React, { useEffect, useState } from 'react';
import { CalendarDays, BookOpen, MapPin, Clock } from 'lucide-react';
import * as studentApi from '../../api/student.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { formatDate } from '../../utils.js';

export default function StudentSchedule() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getSchedule().then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;
  if (!data) return null;

  return (
    <div>
      <PageHeader title="Schedule" subtitle="Your enrolled subjects and exam timetable." />

      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/50">Subjects</p>
      {data.subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects enrolled" message="Your enrollments will show up here." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead><tr><th>Code</th><th>Subject</th><th>Credits</th><th>Faculty</th></tr></thead>
            <tbody>
              {data.subjects.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.code}</td>
                  <td className="font-medium">{s.name}</td>
                  <td className="text-ink/60">{s.credits}</td>
                  <td className="text-ink/60">{s.facultyName || 'Unassigned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mb-3 mt-7 text-xs font-medium uppercase tracking-wide text-ink/50">Exam timetable</p>
      {data.exams.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No exams scheduled" message="Nothing on the calendar yet." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.exams.map((ex) => (
            <div key={ex.id} className="stripe-card border-l-student">
              <p className="font-mono text-xs text-ink/45">{ex.subjectCode}</p>
              <p className="font-display font-semibold text-ink">{ex.subjectName}</p>
              <div className="mt-2.5 space-y-1 text-xs text-ink/55">
                <p className="flex items-center gap-1.5"><CalendarDays size={13} /> {formatDate(ex.exam_date)}</p>
                <p className="flex items-center gap-1.5"><Clock size={13} /> {ex.start_time} · {ex.duration_minutes} min</p>
                {ex.venue && <p className="flex items-center gap-1.5"><MapPin size={13} /> {ex.venue}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
