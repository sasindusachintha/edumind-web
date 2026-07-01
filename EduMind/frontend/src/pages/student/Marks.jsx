import React, { useEffect, useState } from 'react';
import { PencilLine } from 'lucide-react';
import * as studentApi from '../../api/student.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';

export default function StudentMarks() {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getMarks().then((res) => setMarks(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Marks" subtitle="Your internal and final exam marks by subject." />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : marks.length === 0 ? (
        <EmptyState icon={PencilLine} title="No marks yet" message="Your grades will appear here once entered by faculty." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead><tr><th>Code</th><th>Subject</th><th>Credits</th><th>Internal (/100)</th><th>Final exam (/100)</th></tr></thead>
            <tbody>
              {marks.map((m, i) => (
                <tr key={i}>
                  <td className="font-mono text-xs">{m.code}</td>
                  <td className="font-medium">{m.subjectName}</td>
                  <td className="text-ink/60">{m.credits}</td>
                  <td className="text-ink/60">{m.internalMarks ?? '—'}</td>
                  <td className="text-ink/60">{m.examMarks ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
