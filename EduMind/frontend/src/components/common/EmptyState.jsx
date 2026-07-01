import React from 'react';

export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-slate py-14 text-center">
      {Icon && <Icon size={28} className="mb-3 text-ink/30" />}
      <p className="font-display text-sm font-semibold text-ink">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-ink/50">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
