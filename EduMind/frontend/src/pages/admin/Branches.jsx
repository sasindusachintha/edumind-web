import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import * as adminApi from '../../api/admin.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { errMsg } from '../../utils.js';

const emptyForm = { name: '', code: '', description: '' };

export default function AdminBranches() {
  const { push } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listBranches().then((res) => setList(res.data)).finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  function openCreate() { setEditing(null); setForm(emptyForm); setFormError(''); setModalOpen(true); }
  function openEdit(b) { setEditing(b); setForm({ name: b.name, code: b.code, description: b.description || '' }); setFormError(''); setModalOpen(true); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await adminApi.updateBranch(editing.id, form);
        push('Branch updated successfully.');
      } else {
        await adminApi.createBranch(form);
        push('Branch created successfully.');
      }
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
      await adminApi.deleteBranch(deleteTarget.id);
      push('Branch removed.');
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
        title="Branches"
        subtitle="The academic departments students and subjects belong to."
        actions={<button className="btn-primary-admin" onClick={openCreate}><Plus size={16} /> Add branch</button>}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : list.length === 0 ? (
        <EmptyState icon={Building2} title="No branches yet" message="Create your first academic branch to start organizing students and subjects." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => (
            <div key={b.id} className="stripe-card border-l-admin">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs text-ink/45">{b.code}</p>
                  <p className="font-display text-base font-semibold text-ink">{b.name}</p>
                </div>
                <div className="flex gap-1">
                  <button className="rounded-md p-1.5 text-ink/45 hover:bg-paper hover:text-admin" onClick={() => openEdit(b)} aria-label="Edit"><Pencil size={14} /></button>
                  <button className="rounded-md p-1.5 text-ink/45 hover:bg-paper hover:text-danger" onClick={() => setDeleteTarget(b)} aria-label="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
              {b.description && <p className="mt-2 text-sm text-ink/55">{b.description}</p>}
              <div className="mt-3 flex gap-4 text-xs text-ink/45">
                <span>{b.studentCount} students</span>
                <span>{b.subjectCount} subjects</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit branch' : 'Add branch'}>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {formError && <p className="rounded-md bg-danger/5 px-3 py-2 text-sm text-danger">{formError}</p>}
          <div><label className="label">Branch name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Branch code</label><input className="input" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary-admin" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Remove ${deleteTarget?.name}? Students and subjects assigned to it will become unassigned.`}
      />
    </div>
  );
}
