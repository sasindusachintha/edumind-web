import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import * as adminApi from '../../api/admin.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { errMsg } from '../../utils.js';

const emptyForm = { name: '', code: '', credits: 3, semester: 1, branchId: '', facultyId: '' };

export default function AdminSubjects() {
  const { push } = useToast();
  const [list, setList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [faculty, setFaculty] = useState([]);
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
    adminApi.listSubjects().then((res) => setList(res.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    adminApi.listBranches().then((res) => setBranches(res.data));
    adminApi.listFaculty().then((res) => setFaculty(res.data));
  }, [load]);

  function openCreate() { setEditing(null); setForm(emptyForm); setFormError(''); setModalOpen(true); }
  function openEdit(s) {
    setEditing(s);
    setForm({ name: s.name, code: s.code, credits: s.credits, semester: s.semester, branchId: s.branch_id || '', facultyId: s.faculty_id || '' });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await adminApi.updateSubject(editing.id, form);
        push('Subject updated successfully.');
      } else {
        await adminApi.createSubject(form);
        push('Subject created successfully.');
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
      await adminApi.deleteSubject(deleteTarget.id);
      push('Subject removed.');
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
        title="Subjects"
        subtitle={`${list.length} subject${list.length === 1 ? '' : 's'} across the curriculum`}
        actions={<button className="btn-primary-admin" onClick={openCreate}><Plus size={16} /> Add subject</button>}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : list.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects yet" message="Add the first subject to start building the curriculum." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr><th>Code</th><th>Subject</th><th>Credits</th><th>Semester</th><th>Branch</th><th>Faculty</th><th></th></tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.code}</td>
                  <td className="font-medium">{s.name}</td>
                  <td className="text-ink/60">{s.credits}</td>
                  <td className="text-ink/60">{s.semester}</td>
                  <td className="text-ink/60">{s.branchName || '—'}</td>
                  <td className="text-ink/60">{s.facultyName || 'Unassigned'}</td>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit subject' : 'Add subject'}>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {formError && <p className="rounded-md bg-danger/5 px-3 py-2 text-sm text-danger">{formError}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Subject name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Subject code</label><input className="input" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Credits</label><input className="input" type="number" min={1} max={6} value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} /></div>
            <div><label className="label">Semester</label><input className="input" type="number" min={1} max={8} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Branch</label>
              <select className="input" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                <option value="">Unassigned</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Faculty</label>
              <select className="input" value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })}>
                <option value="">Unassigned</option>
                {faculty.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
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
        message={`Remove ${deleteTarget?.name}? Enrollments, attendance, and marks tied to it will be affected.`}
      />
    </div>
  );
}
