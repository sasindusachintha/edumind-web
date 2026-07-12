import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import * as adminApi from '../../api/admin.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { errMsg } from '../../utils.js';

const emptyForm = { name: '', email: '', password: '', phone: '', facultyNo: '', designation: 'Lecturer', branchId: '' };

export default function AdminFaculty() {
  const { push } = useToast();
  const [list, setList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listFaculty({ search }).then((res) => setList(res.data)).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { adminApi.listBranches().then((res) => setBranches(res.data)); }, []);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(f) {
    setEditing(f);
    setForm({
      name: f.name, email: f.email, phone: f.phone || '', branchId: f.branchId || '',
      designation: f.designation, status: f.status, facultyNo: f.faculty_no, password: ''
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await adminApi.updateFaculty(editing.id, form);
        push('Faculty member updated successfully.');
      } else {
        await adminApi.createFaculty(form);
        push('Faculty member added successfully.');
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
      await adminApi.deleteFaculty(deleteTarget.id);
      push('Faculty member removed.');
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
        title="Faculty"
        subtitle={`${list.length} faculty member${list.length === 1 ? '' : 's'}`}
        actions={<button className="btn-primary-admin" onClick={openCreate}><Plus size={16} /> Add faculty</button>}
      />

      <div className="mb-4 relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
        <input className="input pl-9" placeholder="Search by name, email, or ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : list.length === 0 ? (
        <EmptyState icon={Users} title="No faculty found" message="Try a different search, or add the first faculty record." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Faculty ID</th><th>Name</th><th>Email</th><th>Designation</th><th>Branch</th><th>Subjects</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id}>
                  <td className="font-mono text-xs">{f.faculty_no}</td>
                  <td className="font-medium">{f.name}</td>
                  <td className="text-ink/60">{f.email}</td>
                  <td className="text-ink/60">{f.designation}</td>
                  <td className="text-ink/60">{f.branchName || '—'}</td>
                  <td className="text-ink/60">{f.subjectCount}</td>
                  <td><Badge tone={Number(f.status) === 1 ? 'success' : 'neutral'}>{Number(f.status) === 1 ? 'Active' : 'Disabled'}</Badge></td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      <button className="rounded-md p-1.5 text-ink/45 hover:bg-paper hover:text-admin" onClick={() => openEdit(f)} aria-label="Edit"><Pencil size={15} /></button>
                      <button className="rounded-md p-1.5 text-ink/45 hover:bg-paper hover:text-danger" onClick={() => setDeleteTarget(f)} aria-label="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit faculty' : 'Add faculty'}>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {formError && <p className="rounded-md bg-danger/5 px-3 py-2 text-sm text-danger">{formError}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Full name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Faculty no.</label><input className="input" required disabled={!!editing} value={form.facultyNo} onChange={(e) => setForm({ ...form, facultyNo: e.target.value })} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          {!editing && (
            <div><label className="label">Password</label><input className="input" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Designation</label><input className="input" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
            <div>
              <label className="label">Branch</label>
              <select className="input" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                <option value="">Unassigned</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          {editing && (
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}>
                <option value={1}>Active</option>
                <option value={0}>Disabled</option>
              </select>
            </div>
          )}
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
        message={`Remove ${deleteTarget?.name}? This deletes their account and unassigns their subjects.`}
      />
    </div>
  );
}
