import React, { useState } from 'react';
import { Menu, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_THEME } from '../../theme.js';
import IdTag from '../common/IdTag.jsx';

export default function Topbar({ role, onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = ROLE_THEME[role];
  const [open, setOpen] = useState(false);

  const idNumber = user?.student_no || user?.faculty_no || (user?.role === 'admin' ? 'ADMIN' : '');
  const current = theme.nav.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)));
  const title = current?.label || theme.label;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="flex items-center justify-between border-b border-slate bg-white px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <button className="rounded-md p-1.5 text-ink/60 hover:bg-paper md:hidden" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold text-ink">{title}</h1>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-paper"
        >
          <IdTag name={user?.name} idNumber={idNumber} accent={theme.accent} />
          <ChevronDown size={15} className="text-ink/40" />
        </button>
        {open && (
          <div className="absolute right-0 z-20 mt-2 w-44 rounded-md border border-slate bg-white py-1 shadow-lg">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink/70 hover:bg-paper"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
