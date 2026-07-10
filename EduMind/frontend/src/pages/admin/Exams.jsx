import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, CalendarClock, MapPin, Clock } from 'lucide-react';
import * as adminApi from '../../api/admin.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { errMsg, formatDate } from '../../utils.js';

const emptyForm = { subjectId: '', examDate: '', startTime: '', durationMinutes: 120, venue: '' };

export default function AdminExams() {
  const { push } = useToast();
  const [list, setList] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listExams().then((res) => setList(res.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); adminApi.listSubjects().then((res) => setSubjects(res.data)); }, [load]);

  function openCreate() { setForm(emptyForm); setFormError(''); setModalOpen(true); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await adminApi.createExam(form);
      push('Exam scheduled successfully.');
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
      await adminApi.deleteExam(deleteTarget.id);
      push('Exam removed.');
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
        title="Exams"
        subtitle="The exam timetable across all subjects."
        actions={<button className="btn-primary-admin" onClick={openCreate}><Plus size={16} /> Schedule exam</button>}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : list.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No exams scheduled" message="Schedule the first exam to populate the timetable." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((ex) => (
            <div key={ex.id} className="stripe-card border-l-admin">
              <p className="font-mono text-xs text-ink/45">{ex.subjectCode}</p>
              <p className="font-display font-semibold text-ink">{ex.subjectName}</p>
              <div className="mt-2.5 space-y-1 text-xs text-ink/55">
                <p className="flex items-center gap-1.5"><CalendarClock size={13} /> {formatDate(ex.exam_date)}</p>
                <p className="flex items-center gap-1.5"><Clock size={13} /> {ex.start_time} · {ex.duration_minutes} min</p>
                {ex.venue && <p className="flex items-center gap-1.5"><MapPin size={13} /> {ex.venue}</p>}
              </div>
              <button
                className="mt-3 flex items-center gap-1 text-xs font-medium text-danger hover:underline"
                onClick={() => setDeleteTarget(ex)}
              >
                <Trash2 size={13} /> Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Schedule exam">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {formError && <p className="rounded-md bg-danger/5 px-3 py-2 text-sm text-danger">{formError}</p>}
          <div>
            <label className="label">Subject</label>
            <select className="input" required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              <option value="">Select a subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date</label><input className="input" type="date" required value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} /></div>
            <div><label className="label">Start time</label><input className="input" type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Duration (minutes)</label><input className="input" type="number" min={30} step={15} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} /></div>
            <div><label className="label">Venue</label><input className="input" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary-admin" disabled={saving}>{saving ? 'Scheduling…' : 'Schedule'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Remove the exam for ${deleteTarget?.subjectName}?`}
      />
    </div>
  );
}
