import React, { useEffect, useState, useCallback } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import * as studentApi from '../../api/student.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { formatDateTime } from '../../utils.js';

const TYPE_ICON = { info: Info, warning: AlertTriangle, success: CheckCircle2 };
const TYPE_CLASS = { info: 'text-admin', warning: 'text-warn', success: 'text-success' };

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    studentApi.getNotifications().then((res) => setNotifications(res.data)).finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function handleClick(n) {
    if (n.is_read) return;
    await studentApi.markNotificationRead(n.id);
    setNotifications((ns) => ns.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
  }

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Updates and warnings relevant to you." />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" message="New notifications will show up here." />
      ) : (
        <div className="card divide-y divide-slate p-0">
          {notifications.map((n) => {
            const Icon = TYPE_ICON[n.type] || Info;
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-paper ${!n.is_read ? 'bg-student-soft/40' : ''}`}
              >
                <Icon size={17} className={`mt-0.5 flex-shrink-0 ${TYPE_CLASS[n.type] || 'text-ink/40'}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${n.is_read ? 'text-ink/60' : 'font-medium text-ink'}`}>{n.message}</p>
                  <p className="mt-0.5 text-xs text-ink/35">{formatDateTime(n.created_at)}</p>
                </div>
                {!n.is_read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-student" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
