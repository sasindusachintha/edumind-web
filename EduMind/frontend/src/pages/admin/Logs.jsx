import React, { useEffect, useState } from 'react';
import { ScrollText, Search } from 'lucide-react';
import * as adminApi from '../../api/admin.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Badge from '../../components/common/Badge.jsx';
import { formatDateTime } from '../../utils.js';

const ROLE_TONE = { admin: 'admin', faculty: 'faculty', student: 'student' };

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminApi.listLogs().then((res) => setLogs(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) =>
    !search ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.userName || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.details || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Activity logs" subtitle="The last 200 actions taken across the system." />

      <div className="mb-4 relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
        <input className="input pl-9" placeholder="Filter by user or action…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ScrollText} title="No activity recorded" message="Actions taken by admins, faculty, and students will appear here." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead><tr><th>Time</th><th>User</th><th>Role</th><th>Action</th><th>Details</th></tr></thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap text-ink/55">{formatDateTime(l.created_at)}</td>
                  <td className="font-medium">{l.userName || 'System'}</td>
                  <td>{l.role && <Badge tone={ROLE_TONE[l.role] || 'neutral'}>{l.role}</Badge>}</td>
                  <td className="font-mono text-xs text-ink/70">{l.action}</td>
                  <td className="text-ink/55">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
