import React from 'react';

const TONES = {
  success: 'bg-success/10 text-success',
  warn: 'bg-warn/10 text-warn',
  danger: 'bg-danger/10 text-danger',
  neutral: 'bg-slate text-ink/60',
  admin: 'bg-admin-soft text-admin-dark',
  faculty: 'bg-faculty-soft text-faculty-dark',
  student: 'bg-student-soft text-student-dark'
};

export default function Badge({ tone = 'neutral', children }) {
  return <span className={`badge ${TONES[tone] || TONES.neutral}`}>{children}</span>;
}
