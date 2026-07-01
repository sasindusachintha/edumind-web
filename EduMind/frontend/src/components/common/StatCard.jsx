import React from 'react';

export default function StatCard({ icon: Icon, label, value, accent = '#3949AB', hint }) {
  return (
    <div className="stripe-card" style={{ borderLeftColor: accent }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink/45">{hint}</p>}
        </div>
        {Icon && (
          <div className="rounded-lg p-2" style={{ backgroundColor: `${accent}1A` }}>
            <Icon size={18} style={{ color: accent }} />
          </div>
        )}
      </div>
    </div>
  );
}
