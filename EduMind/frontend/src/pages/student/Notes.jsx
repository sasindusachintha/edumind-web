import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, StickyNote, Share2 } from 'lucide-react';
import * as studentApi from '../../api/student.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { errMsg, formatDate } from '../../utils.js';

const emptyForm = { title: '', content: '', isShared: false };

export default function StudentNotes() {
  const { push } = useToast();
  const [data, setData] = useState({ own: [], shared: [] });
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    studentApi.listNotes().then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  function openCreate() { setEditing(null); setForm(emptyForm); setModalOpen(true); }
  function openEdit(n) { setEditing(n); setForm({ title: n.title, content: n.content, isShared: !!n.is_shared }); setModalOpen(true); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await studentApi.updateNote(editing.id, form);
        push('Note updated.');
      } else {
        await studentApi.createNote(form);
        push('Note created.');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      push(errMsg(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await studentApi.deleteNote(deleteTarget.id);
      push('Note deleted.');
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
        title="Notes"
        subtitle="Personal study notes — share with classmates if useful."
        actions={<button className="btn-primary-student" onClick={openCreate}><Plus size={16} /> New note</button>}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : (
        <>
          {data.own.length === 0 ? (
            <EmptyState icon={StickyNote} title="No notes yet" message="Jot down reminders or anything worth keeping track of." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.own.map((n) => (
                <div key={n.id} className="card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display font-semibold text-ink">{n.title}</p>
                    {!!n.is_shared && <Share2 size={14} className="mt-0.5 flex-shrink-0 text-student" />}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink/60">{n.content}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-ink/35">{formatDate(n.updated_at)}</p>
                    <div className="flex gap-1">
                      <button className="rounded-md p-1.5 text-ink/45 hover:bg-paper hover:text-student" onClick={() => openEdit(n)} aria-label="Edit"><Pencil size={13} /></button>
                      <button className="rounded-md p-1.5 text-ink/45 hover:bg-paper hover:text-danger" onClick={() => setDeleteTarget(n)} aria-label="Delete"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.shared.length > 0 && (
            <>
              <p className="mb-3 mt-7 text-xs font-medium uppercase tracking-wide text-ink/50">Shared by classmates</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.shared.map((n) => (
                  <div key={n.id} className="stripe-card border-l-student">
                    <p className="font-display font-semibold text-ink">{n.title}</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink/60">{n.content}</p>
                    <p className="mt-2 text-xs text-ink/40">by {n.authorName} · {formatDate(n.updated_at)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit note' : 'New note'}>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div><label className="label">Title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Content</label><textarea className="input" rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={form.isShared} onChange={(e) => setForm({ ...form, isShared: e.target.checked })} />
            Share with classmates
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary-student" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} message={`Delete the note "${deleteTarget?.title}"?`} />
    </div>
  );
}
