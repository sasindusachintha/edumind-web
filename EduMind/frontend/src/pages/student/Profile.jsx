import React, { useEffect, useState } from 'react';
import { UserCircle, KeyRound } from 'lucide-react';
import * as studentApi from '../../api/student.js';
import * as authApi from '../../api/auth.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import IdTag from '../../components/common/IdTag.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { errMsg } from '../../utils.js';
import { ROLE_THEME } from '../../theme.js';

export default function StudentProfile() {
  const { push } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    studentApi.getProfile().then((res) => {
      setProfile(res.data);
      setForm({ name: res.data.name, phone: res.data.phone || '' });
    }).finally(() => setLoading(false));
  }, []);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await studentApi.updateProfile(form);
      push('Profile updated successfully.');
    } catch (err) {
      push(errMsg(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwSaving(true);
    try {
      await authApi.changePassword(pwForm.currentPassword, pwForm.newPassword);
      push('Password changed successfully.');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      push(errMsg(err), 'error');
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your student account details." />

      <div className="mb-5 flex items-center gap-3">
        <IdTag name={profile.name} idNumber={profile.student_no} sub={`Semester ${profile.semester}`} accent={ROLE_THEME.student.accent} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center gap-2"><UserCircle size={16} className="text-student" /><p className="font-display text-sm font-semibold text-ink">Profile details</p></div>
          <form onSubmit={handleProfileSubmit} className="space-y-3.5">
            <div><label className="label">Full name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="label">Email</label><input className="input bg-paper" value={profile.email} disabled /></div>
            <div><label className="label">Branch</label><input className="input bg-paper" value={profile.branchName || '—'} disabled /></div>
            <button type="submit" className="btn-primary-student" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          </form>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center gap-2"><KeyRound size={16} className="text-student" /><p className="font-display text-sm font-semibold text-ink">Change password</p></div>
          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            <div><label className="label">Current password</label><input className="input" type="password" required value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} /></div>
            <div><label className="label">New password</label><input className="input" type="password" required minLength={6} value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} /></div>
            <button type="submit" className="btn-primary-student" disabled={pwSaving}>{pwSaving ? 'Updating…' : 'Update password'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
