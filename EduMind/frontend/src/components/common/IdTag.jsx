import React from 'react';

/**
 * IdTag — signature identity chip used wherever a person's identity needs
 * grounding (topbar, list rows, profile headers). Modeled on the physical
 * artifact every student/faculty member already has: a campus ID card,
 * with a colored edge stripe (role) and a monospace ID number.
 */
export default function IdTag({ name, idNumber, accent = '#3949AB', sub }) {
  return (
    <div className="id-tag" style={{ borderLeftColor: accent }}>
      <div className="leading-tight">
        <div className="text-sm font-medium text-ink">{name}</div>
        {sub && <div className="text-[11px] text-ink/50">{sub}</div>}
      </div>
      {idNumber && <span className="id-tag-num">{idNumber}</span>}
    </div>
  );
}
