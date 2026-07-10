import React, { useEffect, useState, useCallback } from 'react';
import { Search, GraduationCap } from 'lucide-react';
import * as facultyApi from '../../api/faculty.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';

export default function FacultyStudents() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    facultyApi.searchStudents({ search, subjectId }).then((res) => setStudents(res.data)).finally(() => setLoading(false));
  }, [search, subjectId]);

  useEffect(() => { facultyApi.getMySubjects().then((res) => setSubjects(res.data)); }, []);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader title="Students" subtitle="Everyone enrolled in your subjects." />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
          <input className="input pl-9" placeholder="Search by name or ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-[200px]" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : students.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No students found" message="Try a different search or subject filter." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead><tr><th>Student ID</th><th>Name</th><th>Email</th><th>Semester</th><th>Branch</th></tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.student_no}</td>
                  <td className="font-medium">{s.name}</td>
                  <td className="text-ink/60">{s.email}</td>
                  <td className="text-ink/60">{s.semester}</td>
                  <td className="text-ink/60">{s.branchName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
