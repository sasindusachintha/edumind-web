import React from 'react';
import { GraduationCap, Users, Building2, BookOpen, Megaphone } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import RadialGauge from '../../components/common/RadialGauge.jsx';
import { ROLE_THEME } from '../../theme.js';

const ACCENT = ROLE_THEME.admin.accent;

// Demo data — this page is intentionally not wired to the backend yet.
const data = {
  totalStudents: 482,
  totalFaculty: 36,
  totalBranches: 4,
  totalSubjects: 28,
  avgAttendance: 87,
  attendanceTrend: [
    { date: '2026-05-01', rate: 84 },
    { date: '2026-05-08', rate: 86 },
    { date: '2026-05-15', rate: 88 },
    { date: '2026-05-22', rate: 85 },
    { date: '2026-05-29', rate: 89 },
    { date: '2026-06-05', rate: 87 }
  ],
  branchBreakdown: [
    { branch: 'Computing', students: 168 },
    { branch: 'Business', students: 124 },
    { branch: 'Engineering', students: 110 },
    { branch: 'Design', students: 80 }
  ],
  recentNotices: [
    { id: 1, title: 'Mid-semester exam timetable released', postedBy: 'Admin Office', created_at: '2026-06-15', audience: 'All' },
    { id: 2, title: 'Library extended hours during exam week', postedBy: 'Admin Office', created_at: '2026-06-12', audience: 'Students' },
    { id: 3, title: 'Faculty meeting rescheduled to Friday', postedBy: 'Admin Office', created_at: '2026-06-10', audience: 'Faculty' }
  ]
};

function formatShort(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function AdminOverview() {
  return (
    <div>
      <PageHeader title="Overview" subtitle="A snapshot of the whole college." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={GraduationCap} label="Students" value={data.totalStudents} accent={ACCENT} />
        <StatCard icon={Users} label="Faculty" value={data.totalFaculty} accent={ACCENT} />
        <StatCard icon={Building2} label="Branches" value={data.totalBranches} accent={ACCENT} />
        <StatCard icon={BookOpen} label="Subjects" value={data.totalSubjects} accent={ACCENT} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card flex flex-col items-center justify-center lg:col-span-1">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/50">Average attendance</p>
          <RadialGauge value={data.avgAttendance} size={130} stroke={10} accent={ACCENT} />
          <p className="mt-3 text-center text-xs text-ink/45">Across all sessions recorded this term</p>
        </div>

        <div className="card lg:col-span-2">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/50">Attendance trend</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.attendanceTrend}>
              <CartesianGrid stroke="#E2E5EC" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatShort} fontSize={11} stroke="#8A8FA3" />
              <YAxis fontSize={11} stroke="#8A8FA3" width={32} domain={[0, 100]} />
              <Tooltip labelFormatter={formatShort} formatter={(v) => [`${v}%`, 'Attendance']} />
              <Line type="monotone" dataKey="rate" stroke={ACCENT} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/50">Students by branch</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.branchBreakdown}>
              <CartesianGrid stroke="#E2E5EC" vertical={false} />
              <XAxis dataKey="branch" fontSize={11} stroke="#8A8FA3" />
              <YAxis fontSize={11} stroke="#8A8FA3" width={28} />
              <Tooltip />
              <Bar dataKey="students" fill={ACCENT} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Recent notices</p>
            <Megaphone size={15} className="text-ink/30" />
          </div>
          <ul className="divide-y divide-slate">
            {data.recentNotices.map((n) => (
              <li key={n.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  <p className="text-xs text-ink/45">by {n.postedBy} · {formatShort(n.created_at)}</p>
                </div>
                <span className="rounded-full bg-admin-soft px-2.5 py-0.5 text-xs font-medium text-admin-dark">
                  {n.audience}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
