import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function Layout({ role }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-paper">
      <Sidebar role={role} />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <Sidebar
            role={role}
            className="flex w-64 flex-col bg-white"
            onLinkClick={() => setMobileOpen(false)}
          />
          <div className="flex-1 bg-ink/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar role={role} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
