import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import * as facultyApi from '../../api/faculty.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';

export default function FacultySubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    facultyApi.getMySubjects().then((res) => setSubjects(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="My subjects" subtitle="Subjects you've been assigned to teach." />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects yet" message="Ask an admin to assign a subject to your account." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead><tr><th>Code</th><th>Subject</th><th>Credits</th><th>Semester</th><th>Branch</th><th>Enrolled</th></tr></thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.code}</td>
                  <td className="font-medium">{s.name}</td>
                  <td className="text-ink/60">{s.credits}</td>
                  <td className="text-ink/60">{s.semester}</td>
                  <td className="text-ink/60">{s.branchName || '—'}</td>
                  <td className="text-ink/60">{s.studentCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
