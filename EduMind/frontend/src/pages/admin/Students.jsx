import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, GraduationCap } from 'lucide-react';
import * as adminApi from '../../api/admin.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { errMsg } from '../../utils.js';

const emptyForm = { name: '', email: '', password: '', phone: '', studentNo: '', branchId: '', semester: 1, enrollmentDate: '' };

export default function AdminStudents() {
  const { push } = useToast();
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listStudents({ search, branchId: branchFilter })
      .then((res) => setStudents(res.data))
      .finally(() => setLoading(false));
  }, [search, branchFilter]);

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

  function openEdit(s) {
    setEditing(s);
    setForm({
      name: s.name, email: s.email, phone: s.phone || '', branchId: s.branchId || '',
      semester: s.semester, status: s.status, studentNo: s.student_no, password: '', enrollmentDate: ''
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
        await adminApi.updateStudent(editing.id, form);
        push('Student updated successfully.');
      } else {
        await adminApi.createStudent(form);
        push('Student added successfully.');
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
      await adminApi.deleteStudent(deleteTarget.id);
      push('Student removed.');
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
        title="Students"
        subtitle={`${students.length} student${students.length === 1 ? '' : 's'} across all branches`}
        actions={<button className="btn-primary-admin" onClick={openCreate}><Plus size={16} /> Add student</button>}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
          <input className="input pl-9" placeholder="Search by name, email, or ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-[180px]" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option value="">All branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : students.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No students found" message="Try a different search, or add the first student record." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Student ID</th><th>Name</th><th>Email</th><th>Branch</th><th>Semester</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.student_no}</td>
                  <td className="font-medium">{s.name}</td>
                  <td className="text-ink/60">{s.email}</td>
                  <td className="text-ink/60">{s.branchName || '—'}</td>
                  <td className="text-ink/60">{s.semester}</td>
                  <td><Badge tone={s.status === 'active' ? 'success' : 'neutral'}>{s.status}</Badge></td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      <button className="rounded-md p-1.5 text-ink/45 hover:bg-paper hover:text-admin" onClick={() => openEdit(s)} aria-label="Edit"><Pencil size={15} /></button>
                      <button className="rounded-md p-1.5 text-ink/45 hover:bg-paper hover:text-danger" onClick={() => setDeleteTarget(s)} aria-label="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit student' : 'Add student'}>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {formError && <p className="rounded-md bg-danger/5 px-3 py-2 text-sm text-danger">{formError}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Full name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Student no.</label><input className="input" required disabled={!!editing} value={form.studentNo} onChange={(e) => setForm({ ...form, studentNo: e.target.value })} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          {!editing && (
            <div><label className="label">Password</label><input className="input" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Branch</label>
              <select className="input" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                <option value="">Unassigned</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div><label className="label">Semester</label><input className="input" type="number" min={1} max={8} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} /></div>
          </div>
          {editing && (
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
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
        message={`Remove ${deleteTarget?.name}? This deletes their account and all associated records.`}
      />
    </div>
  );
}
