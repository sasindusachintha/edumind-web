import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, FolderUp, FileText, Download } from 'lucide-react';
import * as facultyApi from '../../api/faculty.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { errMsg, formatDate } from '../../utils.js';

export default function FacultyMaterials() {
  const { push } = useToast();
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ subjectId: '', title: '', description: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    facultyApi.listMaterials().then((res) => setMaterials(res.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); facultyApi.getMySubjects().then((res) => setSubjects(res.data)); }, [load]);

  function openCreate() {
    setForm({ subjectId: subjects[0]?.id || '', title: '', description: '' });
    setFile(null);
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) { setFormError('Please choose a file to upload.'); return; }
    setSaving(true);
    setFormError('');
    try {
      const fd = new FormData();
      fd.append('subjectId', form.subjectId);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('file', file);
      await facultyApi.uploadMaterial(fd);
      push('Material uploaded successfully.');
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
      await facultyApi.deleteMaterial(deleteTarget.id);
      push('Material removed.');
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
        title="Materials"
        subtitle="Course materials shared with students."
        actions={<button className="btn-primary-faculty" onClick={openCreate}><Plus size={16} /> Upload material</button>}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : materials.length === 0 ? (
        <EmptyState icon={FolderUp} title="No materials yet" message="Upload lecture notes, slides, or resources for your students." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => (
            <div key={m.id} className="stripe-card border-l-faculty">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-ink/45">{m.subjectCode}</p>
                  <p className="truncate font-display font-semibold text-ink">{m.title}</p>
                </div>
                <FileText size={16} className="mt-0.5 flex-shrink-0 text-faculty" />
              </div>
              {m.description && <p className="mt-1.5 text-sm text-ink/55">{m.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <a href={`/uploads/${m.file_path}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-medium text-faculty hover:underline">
                  <Download size={13} /> {formatDate(m.uploaded_at)}
                </a>
                <button className="text-ink/40 hover:text-danger" onClick={() => setDeleteTarget(m)} aria-label="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Upload material">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {formError && <p className="rounded-md bg-danger/5 px-3 py-2 text-sm text-danger">{formError}</p>}
          <div>
            <label className="label">Subject</label>
            <select className="input" required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
            </select>
          </div>
          <div><label className="label">Title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <label className="label">File</label>
            <input className="input" type="file" required onChange={(e) => setFile(e.target.files[0])} />
            <p className="mt-1 text-xs text-ink/40">PDF, Word, PowerPoint, ZIP, or image — up to 20MB.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary-faculty" disabled={saving}>{saving ? 'Uploading…' : 'Upload'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Remove "${deleteTarget?.title}"? Students will no longer be able to access it.`}
      />
    </div>
  );
}
