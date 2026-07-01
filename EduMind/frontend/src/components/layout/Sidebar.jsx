import React from 'react';
import { NavLink } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { ROLE_THEME } from '../../theme.js';

export default function Sidebar({ role, className = 'hidden w-60 flex-shrink-0 flex-col border-r border-slate bg-white md:flex', onLinkClick }) {
  const theme = ROLE_THEME[role];

  return (
    <aside className={className}>
      <div className="flex items-center gap-2 border-b border-slate px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: theme.accent }}>
          <GraduationCap size={18} className="text-white" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-sm font-bold text-ink">EduMind</p>
          <p className="text-[11px] text-ink/45">{theme.label} Portal</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {theme.nav.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={onLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-md border-l-[3px] px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-current bg-paper text-ink'
                      : 'border-transparent text-ink/55 hover:bg-paper hover:text-ink'
                  }`
                }
                style={({ isActive }) => (isActive ? { borderLeftColor: theme.accent } : {})}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={17} style={{ color: isActive ? theme.accent : undefined }} />
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
