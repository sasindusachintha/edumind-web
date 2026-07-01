import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <GraduationCap size={32} className="mb-3 text-admin" />
      <h1 className="font-display text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-1.5 text-sm text-ink/50">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/login" className="btn-primary-admin mt-5">Back to sign in</Link>
    </div>
  );
}
