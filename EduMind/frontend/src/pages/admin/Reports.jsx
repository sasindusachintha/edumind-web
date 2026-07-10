import React, { useEffect, useState } from 'react';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as adminApi from '../../api/admin.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Badge from '../../components/common/Badge.jsx';

export default function AdminReports() {
  const [attendance, setAttendance] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.attendanceReport(), adminApi.performanceReport()])
      .then(([a, p]) => { setAttendance(a.data); setPerformance(p.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;

  const atRisk = attendance.filter((r) => r.percentage !== null && r.percentage < 75);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Attendance standing and academic performance, college-wide." />

      <div className="mb-5 card">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 size={16} className="text-admin" />
          <p className="font-display text-sm font-semibold text-ink">Average marks by subject</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={performance}>
            <CartesianGrid stroke="#E2E5EC" vertical={false} />
            <XAxis dataKey="code" fontSize={11} stroke="#8A8FA3" />
            <YAxis fontSize={11} stroke="#8A8FA3" width={28} domain={[0, 100]} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="avgInternal" name="Internal" fill="#3949AB" radius={[4, 4, 0, 0]} />
            <Bar dataKey="avgExam" name="Final exam" fill="#C97F00" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-0">
        <div className="flex items-center justify-between border-b border-slate p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-warn" />
            <p className="font-display text-sm font-semibold text-ink">Attendance standing</p>
          </div>
          {atRisk.length > 0 && <Badge tone="danger">{atRisk.length} below 75%</Badge>}
        </div>
        <table className="table-base">
          <thead>
            <tr><th>Student ID</th><th>Name</th><th>Branch</th><th>Sessions</th><th>Attended</th><th>Attendance</th></tr>
          </thead>
          <tbody>
            {attendance.map((r) => (
              <tr key={r.studentId}>
                <td className="font-mono text-xs">{r.student_no}</td>
                <td className="font-medium">{r.name}</td>
                <td className="text-ink/60">{r.branchName || '—'}</td>
                <td className="text-ink/60">{r.totalSessions}</td>
                <td className="text-ink/60">{r.attended}</td>
                <td>
                  <Badge tone={r.percentage === null ? 'neutral' : r.percentage < 50 ? 'danger' : r.percentage < 75 ? 'warn' : 'success'}>
                    {r.percentage === null ? 'No data' : `${r.percentage}%`}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
