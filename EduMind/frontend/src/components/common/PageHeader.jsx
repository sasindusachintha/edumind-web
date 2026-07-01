import React from 'react';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink/50">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
