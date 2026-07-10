import React, { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import * as studentApi from '../../api/student.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { formatDateTime } from '../../utils.js';

export default function StudentNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getNotices().then((res) => setNotices(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Notices" subtitle="Announcements from the college." />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : notices.length === 0 ? (
        <EmptyState icon={Megaphone} title="No notices yet" message="Announcements will appear here as they're published." />
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <div key={n.id} className="card">
              <p className="font-display font-semibold text-ink">{n.title}</p>
              <p className="mt-1 text-sm text-ink/65">{n.content}</p>
              <p className="mt-1.5 text-xs text-ink/40">by {n.postedBy} · {formatDateTime(n.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
