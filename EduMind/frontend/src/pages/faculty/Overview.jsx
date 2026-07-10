import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, ClipboardCheck, PencilLine, FolderUp } from 'lucide-react';
import * as facultyApi from '../../api/faculty.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { ROLE_THEME } from '../../theme.js';

const ACCENT = ROLE_THEME.faculty.accent;

export default function FacultyOverview() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    facultyApi.getMySubjects().then((res) => setSubjects(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;

  const totalStudents = subjects.reduce((sum, s) => sum + Number(s.studentCount || 0), 0);

  return (
    <div>
      <PageHeader title="Overview" subtitle="What you're teaching this term." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={BookOpen} label="Subjects" value={subjects.length} accent={ACCENT} />
        <StatCard icon={Users} label="Total enrollments" value={totalStudents} accent={ACCENT} />
        <StatCard icon={ClipboardCheck} label="Credits taught" value={subjects.reduce((s, x) => s + Number(x.credits || 0), 0)} accent={ACCENT} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2.5">
        <Link to="/faculty/attendance" className="btn-primary-faculty"><ClipboardCheck size={15} /> Mark attendance</Link>
        <Link to="/faculty/marks" className="btn-ghost"><PencilLine size={15} /> Enter marks</Link>
        <Link to="/faculty/materials" className="btn-ghost"><FolderUp size={15} /> Upload material</Link>
      </div>

      <p className="mb-3 mt-7 text-xs font-medium uppercase tracking-wide text-ink/50">Your subjects</p>
      {subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects assigned yet" message="Once an admin assigns subjects to you, they'll appear here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <div key={s.id} className="stripe-card border-l-faculty">
              <p className="font-mono text-xs text-ink/45">{s.code}</p>
              <p className="font-display font-semibold text-ink">{s.name}</p>
              <div className="mt-2.5 flex justify-between text-xs text-ink/50">
                <span>{s.branchName || 'No branch'}</span>
                <span>{s.studentCount} students</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
