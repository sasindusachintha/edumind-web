import React from 'react';
import { BookOpen, Users, ClipboardCheck } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import { ROLE_THEME } from '../../theme.js';

const ACCENT = ROLE_THEME.faculty.accent;

// Demo data — this page is intentionally not wired to the backend yet.
const subjects = [
  { id: 1, code: 'CSE5015', name: 'Software Engineering', branchName: 'Computing', studentCount: 42, credits: 4 },
  { id: 2, code: 'CSE4021', name: 'Database Systems', branchName: 'Computing', studentCount: 38, credits: 3 },
  { id: 3, code: 'CSE3032', name: 'Web Application Development', branchName: 'Computing', studentCount: 45, credits: 3 }
];

export default function FacultyOverview() {
  const totalStudents = subjects.reduce((sum, s) => sum + s.studentCount, 0);
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);

  return (
    <div>
      <PageHeader title="Overview" subtitle="What you're teaching this term." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={BookOpen} label="Subjects" value={subjects.length} accent={ACCENT} />
        <StatCard icon={Users} label="Total enrollments" value={totalStudents} accent={ACCENT} />
        <StatCard icon={ClipboardCheck} label="Credits taught" value={totalCredits} accent={ACCENT} />
      </div>

      <p className="mb-3 mt-7 text-xs font-medium uppercase tracking-wide text-ink/50">Your subjects</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <div key={s.id} className="stripe-card border-l-faculty">
            <p className="font-mono text-xs text-ink/45">{s.code}</p>
            <p className="font-display font-semibold text-ink">{s.name}</p>
            <div className="mt-2.5 flex justify-between text-xs text-ink/50">
              <span>{s.branchName}</span>
              <span>{s.studentCount} students</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
