import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, AlertCircle } from 'lucide-react';
import { forgotPassword, verifyResetOtp, resetPassword } from '../api/auth';

export default function ForgotPassword() {
  const [step, setStep] = useState('request');
  const [form, setForm] = useState({ email: '' });
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!recaptchaSiteKey || typeof document === 'undefined') return;
    if (document.getElementById('google-recaptcha-script')) return;

    const script = document.createElement('script');
    script.id = 'google-recaptcha-script';
    script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [recaptchaSiteKey]);

  async function getCaptchaToken() {
    if (!recaptchaSiteKey || !window.grecaptcha) return undefined;
    await window.grecaptcha.ready();
    return window.grecaptcha.execute(recaptchaSiteKey, { action: 'forgot_password' });
  }

  async function handleRequest(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      setLoading(true);
      const captchaToken = await getCaptchaToken();
      const { data } = await forgotPassword({
        email: form.email,
        captchaToken
      });
      setMessage(data.message || 'OTP sent.');
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send reset OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const captchaToken = await getCaptchaToken();
      const { data: verifyData } = await verifyResetOtp({
        email: form.email,
        otp,
        captchaToken
      });
      setMessage(verifyData.message || 'OTP verified.');
      const { data: resetData } = await resetPassword({
        email: form.email,
        otp,
        newPassword,
        captchaToken
      });
      setMessage(resetData.message || 'Password reset successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-10">
      <div className="w-full max-w-md rounded-card border border-slate bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-admin">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Forgot password</h2>
            <p className="text-sm text-ink/50">Reset your password with OTP.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-md border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-success">
            {message}
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequest} className="space-y-3">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <button type="submit" className="btn-primary-admin w-full" disabled={loading}>
              {loading ? 'Sending OTP…' : 'Send reset OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-3">
            <div>
              <label className="label">OTP</label>
              <input className="input" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            </div>
            <div>
              <label className="label">New password</label>
              <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength="6" required />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength="6" required />
            </div>
            <button type="submit" className="btn-primary-admin w-full" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
          </form>
        )}

        <div className="mt-4 text-sm text-ink/60">
          Back to <Link to="/login" className="font-medium text-admin hover:underline">sign in</Link>
        </div>
      </div>
    </div>
  );
}
