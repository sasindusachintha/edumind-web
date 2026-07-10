import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Megaphone } from 'lucide-react';
import * as adminApi from '../../api/admin.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { errMsg, formatDateTime } from '../../utils.js';

const emptyForm = { title: '', content: '', audience: 'all' };
const AUDIENCE_TONE = { all: 'admin', students: 'student', faculty: 'faculty' };

export default function AdminNotices() {
  const { push } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listNotices().then((res) => setList(res.data)).finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  function openCreate() { setForm(emptyForm); setFormError(''); setModalOpen(true); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await adminApi.createNotice(form);
      push('Notice published successfully.');
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(errMsg(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await adminApi.deleteNotice(deleteTarget.id);
      push('Notice removed.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      push(errMsg(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Notices"
        subtitle="Announcements visible across the college."
        actions={<button className="btn-primary-admin" onClick={openCreate}><Plus size={16} /> Publish notice</button>}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : list.length === 0 ? (
        <EmptyState icon={Megaphone} title="No notices yet" message="Publish the first notice to reach students and faculty." />
      ) : (
        <div className="space-y-3">
          {list.map((n) => (
            <div key={n.id} className="card flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <p className="font-display font-semibold text-ink">{n.title}</p>
                  <Badge tone={AUDIENCE_TONE[n.audience] || 'neutral'}>{n.audience}</Badge>
                </div>
                <p className="text-sm text-ink/65">{n.content}</p>
                <p className="mt-1.5 text-xs text-ink/40">by {n.postedBy} · {formatDateTime(n.created_at)}</p>
              </div>
              <button className="rounded-md p-1.5 text-ink/45 hover:bg-paper hover:text-danger" onClick={() => setDeleteTarget(n)} aria-label="Delete">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Publish notice">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {formError && <p className="rounded-md bg-danger/5 px-3 py-2 text-sm text-danger">{formError}</p>}
          <div><label className="label">Title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Content</label><textarea className="input" rows={4} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
          <div>
            <label className="label">Audience</label>
            <select className="input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              <option value="all">Everyone</option>
              <option value="students">Students only</option>
              <option value="faculty">Faculty only</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary-admin" disabled={saving}>{saving ? 'Publishing…' : 'Publish'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Remove the notice "${deleteTarget?.title}"?`}
      />
    </div>
  );
}
