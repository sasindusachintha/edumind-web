import React, { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import * as studentApi from '../../api/student.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { formatDate } from '../../utils.js';

export default function StudentMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getMaterials().then((res) => setMaterials(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Materials" subtitle="Resources shared by your faculty." />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : materials.length === 0 ? (
        <EmptyState icon={FileText} title="No materials yet" message="Your faculty haven't uploaded anything yet." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => (
            <div key={m.id} className="stripe-card border-l-student">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-ink/45">{m.subjectCode}</p>
                  <p className="truncate font-display font-semibold text-ink">{m.title}</p>
                </div>
                <FileText size={16} className="mt-0.5 flex-shrink-0 text-student" />
              </div>
              {m.description && <p className="mt-1.5 text-sm text-ink/55">{m.description}</p>}
              <a
                href={`/uploads/${m.file_path}`} target="_blank" rel="noreferrer"
                className="mt-3 flex items-center gap-1 text-xs font-medium text-student hover:underline"
              >
                <Download size={13} /> {formatDate(m.uploaded_at)}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
