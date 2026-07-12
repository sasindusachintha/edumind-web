import React, { useEffect, useState, useCallback } from 'react';
import { UserCheck, UserX, ShieldCheck, Clock, Search, Users as UsersIcon } from 'lucide-react';
import { getUsers, updateUserStatus } from '../../api/admin.js';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { errMsg, formatDateTime } from '../../utils.js';

const TABS = [
  { key: '', label: 'All' },
  { key: '0', label: 'Pending / disabled' },
  { key: '1', label: 'Approved' },
];

export default function AdminUsers() {
  const { push } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('0');
  const [actingId, setActingId] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getUsers({ status: tab, search })
      .then(setUsers)
      .catch((err) => push(errMsg(err, 'Failed to load users'), 'error'))
      .finally(() => setLoading(false));
  }, [tab, search, push]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const pendingCount = users.filter((u) => Number(u.status) === 0).length;
  const approvedCount = users.filter((u) => Number(u.status) === 1).length;

  async function approve(user) {
    setActingId(user.id);
    try {
      await updateUserStatus(user.id, 1);
      push(`${user.name} approved.`, 'success');
      load();
    } catch (err) {
      push(errMsg(err, 'Failed to approve user'), 'error');
    } finally {
      setActingId(null);
    }
  }

  async function revoke() {
    setRevoking(true);
    try {
      await updateUserStatus(revokeTarget.id, 0);
      push(`${revokeTarget.name}'s access was revoked.`, 'success');
      setRevokeTarget(null);
      load();
    } catch (err) {
      push(errMsg(err, 'Failed to update user'), 'error');
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="User Approvals"
        subtitle="Review new registrations and manage account access."
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={Clock} label="Pending review" value={pendingCount} accent="#C97F00" />
        <StatCard icon={ShieldCheck} label="Approved" value={approvedCount} accent="#00897B" />
        <StatCard icon={UsersIcon} label="Total shown" value={users.length} accent="#3949AB" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 rounded-md border border-slate bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-admin text-white' : 'text-ink/60 hover:bg-paper'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            className="input pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" message="Nobody matches this filter right now." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Verified</th><th>Status</th><th>Registered</th><th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const approved = Number(u.status) === 1;
                const verified = Number(u.is_verified) === 1;
                return (
                  <tr key={u.id}>
                    <td className="font-medium">{u.name}</td>
                    <td className="text-ink/60">{u.email}</td>
                    <td className="text-ink/60">{u.phone || '—'}</td>
                    <td className="text-ink/60 capitalize">{u.role}</td>
                    <td><Badge tone={verified ? 'success' : 'neutral'}>{verified ? 'Verified' : 'Unverified'}</Badge></td>
                    <td><Badge tone={approved ? 'success' : 'warn'}>{approved ? 'Approved' : 'Pending'}</Badge></td>
                    <td className="text-ink/60">{formatDateTime(u.created_at)}</td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        {!approved && (
                          <button
                            onClick={() => approve(u)}
                            disabled={actingId === u.id}
                            className="rounded-md p-1.5 text-ink/45 hover:bg-paper hover:text-success"
                            aria-label="Approve"
                            title="Approve"
                          >
                            <UserCheck size={15} />
                          </button>
                        )}
                        {approved && (
                          <button
                            onClick={() => setRevokeTarget(u)}
                            className="rounded-md p-1.5 text-ink/45 hover:bg-paper hover:text-danger"
                            aria-label="Revoke access"
                            title="Revoke access"
                          >
                            <UserX size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={revoke}
        loading={revoking}
        confirmLabel="Revoke access"
        message={`Revoke ${revokeTarget?.name}'s access? They won't be able to log in until an admin approves them again.`}
      />
    </div>
  );
}
