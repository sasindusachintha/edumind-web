import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, AlertCircle } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { register as registerUser, verifyOtp } from '../api/auth';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!captchaToken) {
      setError('Please verify that you are not a robot.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        captchaToken
      });
      setMessage(data.message || 'OTP sent. Verify it to activate your account.');
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create account.');
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  }

  // OTP verification only requires email + OTP — no CAPTCHA on this step.
  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      setLoading(true);
      const { data } = await verifyOtp({
        email: form.email,
        otp
      });
      setMessage(data.message || 'Account verified.');
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed.');
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
            <h2 className="font-display text-xl font-bold text-ink">Create account</h2>
            <p className="text-sm text-ink/50">Register with OTP verification.</p>
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

        {step === 'form' ? (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Register as</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength="6" required />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input className="input" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} minLength="6" required />
            </div>

            {/* Google reCAPTCHA v2 — "I'm not a robot" checkbox */}
            <div className="flex justify-start pt-1">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={recaptchaSiteKey}
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
                onErrored={() => setCaptchaToken(null)}
              />
            </div>

            <button type="submit" className="btn-primary-admin w-full" disabled={loading || !captchaToken}>
              {loading ? 'Creating account…' : 'Register'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-3">
            <div>
              <label className="label">Enter OTP</label>
              <input className="input" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary-admin w-full" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>
          </form>
        )}

        <div className="mt-4 text-sm text-ink/60">
          Already have an account? <Link to="/login" className="font-medium text-admin hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
