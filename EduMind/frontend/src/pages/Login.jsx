import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO = [
  { role: 'Admin', email: 'admin@edumind.lk', password: 'Admin@123', accent: '#3949AB' },
  { role: 'Faculty', email: 'rahul.s@edumind.lk', password: 'Faculty@123', accent: '#00897B' },
  { role: 'Student', email: 'amit.s@edumind.lk', password: 'Student@123', accent: '#C97F00' }
];

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.message);
    }
  }

  function fillDemo(d) {
    setEmail(d.email);
    setPassword(d.password);
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-ink px-10 py-10 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-90"
          style={{ background: 'linear-gradient(160deg, #1A1D29 0%, #232845 55%, #2A3585 100%)' }}
        />
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/15">
            <GraduationCap size={20} />
          </div>
          <span className="font-display text-lg font-bold">EduMind</span>
        </div>

        <div className="relative z-10 max-w-sm">
          <h1 className="font-display text-3xl font-bold leading-tight">
             One platform for everything your college needs.
          </h1>
          <p className="mt-3 text-sm text-white/65">
            A modern solution for efficient and organized academic management.
          </p>
          <div className="mt-7 flex gap-2.5">
            {DEMO.map((d) => (
              <span
                key={d.role}
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: `${d.accent}33`, color: '#fff' }}
              >
                {d.role}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/40">Smart College Management System</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-paper px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-admin">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="font-display text-lg font-bold text-ink">EduMind</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-ink/50">Use your college email and password to continue.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@edumind.lk"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-ink/40 hover:text-ink/70"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary-admin w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-7 rounded-card border border-slate bg-white p-4">
            <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-ink/45">Demo accounts</p>
            <div className="space-y-1.5">
              {DEMO.map((d) => (
                <button
                  key={d.role}
                  onClick={() => fillDemo(d)}
                  className="flex w-full items-center justify-between rounded-md border border-slate px-3 py-2 text-left text-xs hover:bg-paper"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.accent }} />
                    <span className="font-medium text-ink">{d.role}</span>
                  </span>
                  <span className="font-mono text-ink/45">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
