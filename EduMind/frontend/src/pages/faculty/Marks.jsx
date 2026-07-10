import React, { useEffect, useState, useCallback } from 'react';
import { PencilLine, Save } from 'lucide-react';
import * as facultyApi from '../../api/faculty.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { errMsg } from '../../utils.js';

export default function FacultyMarks() {
  const { push } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    facultyApi.getMySubjects().then((res) => {
      setSubjects(res.data);
      if (res.data.length > 0) setSubjectId(String(res.data[0].id));
    });
  }, []);

  const load = useCallback(() => {
    if (!subjectId) return;
    setLoading(true);
    facultyApi.getMarksForSubject(subjectId).then((res) => setRows(res.data)).finally(() => setLoading(false));
  }, [subjectId]);

  useEffect(load, [load]);

  function updateField(studentId, field, value) {
    setRows((rs) => rs.map((r) => (r.studentId === studentId ? { ...r, [field]: value } : r)));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const records = rows.map((r) => ({ studentId: r.studentId, internalMarks: r.internalMarks, examMarks: r.examMarks }));
      await facultyApi.saveMarks(subjectId, records);
      push('Marks saved successfully.');
    } catch (err) {
      push(errMsg(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Marks"
        subtitle="Enter internal and final exam marks (out of 100)."
        actions={
          rows.length > 0 && (
            <button className="btn-primary-faculty" onClick={handleSave} disabled={saving}>
              <Save size={15} /> {saving ? 'Saving…' : 'Save marks'}
            </button>
          )
        }
      />

      <div className="mb-4">
        <select className="input max-w-[280px]" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : subjects.length === 0 ? (
        <EmptyState icon={PencilLine} title="No subjects assigned" message="You need a subject assignment before you can enter marks." />
      ) : rows.length === 0 ? (
        <EmptyState icon={PencilLine} title="No students enrolled" message="This subject has no enrolled students yet." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead><tr><th>Student ID</th><th>Name</th><th>Internal (/100)</th><th>Final exam (/100)</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.studentId}>
                  <td className="font-mono text-xs">{r.student_no}</td>
                  <td className="font-medium">{r.name}</td>
                  <td>
                    <input
                      type="number" min={0} max={100} className="input w-24"
                      value={r.internalMarks ?? ''}
                      onChange={(e) => updateField(r.studentId, 'internalMarks', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number" min={0} max={100} className="input w-24"
                      value={r.examMarks ?? ''}
                      onChange={(e) => updateField(r.studentId, 'examMarks', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
