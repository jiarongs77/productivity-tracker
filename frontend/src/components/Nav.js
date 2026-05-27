import React from 'react';

// Navigation links config — add new pages here if needed
const LINKS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'weekly', label: 'Weekly Summary' },
  { id: 'history', label: 'History Search' },
];

export default function Nav({ activePage, setActivePage, onAddTask }) {
  return (
    <nav style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">

        {/* Logo — clicking doesn't navigate, just visual branding */}
        <div className="flex items-center gap-3">
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: 16 }}>⚡</span>
          </div>
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 300 }}>
            FocusFlow
          </span>
        </div>

        {/* Page links — active page gets accent highlight */}
        <div className="flex items-center gap-1">
          {LINKS.map(link => (
            <button
              key={link.id}
              onClick={() => setActivePage(link.id)}
              style={{
                background: activePage === link.id ? 'var(--accent-dim)' : 'transparent',
                color: activePage === link.id ? 'var(--accent)' : 'var(--text-secondary)',
                border: 'none', borderRadius: 8, padding: '0.5rem 1rem',
                cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.15s',
              }}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Add task button — opens the TaskModal in App.js */}
        <button className="btn-primary" onClick={onAddTask}>
          + Add Task
        </button>
      </div>
    </nav>
  );
}