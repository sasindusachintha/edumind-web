import React from 'react';

/**
 * RadialGauge — the app's signature visual motif.
 * A ring readout for percentage-based academic metrics (attendance, marks).
 * Color shifts at the thresholds that actually matter to a student's standing:
 * >=75 healthy (role accent), 50-74 caution (amber), <50 at-risk (red).
 * This ties the visual language directly back to the requirement that drives
 * the whole system: attendance percentage and low-attendance warnings.
 */
export default function RadialGauge({ value = 0, size = 96, stroke = 8, accent = '#3949AB', label }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  let ringColor = accent;
  if (pct < 50) ringColor = '#D64545';
  else if (pct < 75) ringColor = '#C97F00';

  return (
    <div className="inline-flex flex-col items-center gap-1.5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E5EC" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontFamily="Sora, sans-serif"
          fontWeight="700"
          fontSize={size * 0.22}
          fill="#1A1D29"
        >
          {pct}%
        </text>
      </svg>
      {label && <span className="text-xs font-medium text-ink/60">{label}</span>}
    </div>
  );
}
