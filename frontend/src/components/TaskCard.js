import React from 'react';

// Maps each category to an emoji icon for visual identification
const CATEGORY_ICONS = {
  Coding: '💻', Meeting: '🤝', Design: '🎨',
  Research: '🔍', Writing: '✍️', Admin: '📋', Other: '📌',
};

export default function TaskCard({ task, onEdit, onDelete }) {
  return (
    <div className="card" style={{ padding: '1rem 1.25rem' }}>
      <div className="flex items-start justify-between gap-3">

        {/* Left side: icon + task details */}
        <div className="flex items-start gap-3" style={{ flex: 1 }}>

          {/* Category emoji icon — falls back to 📌 for unknown categories */}
          <span style={{ fontSize: '1.2rem', marginTop: 2 }}>
            {CATEGORY_ICONS[task.category] || '📌'}
          </span>

          <div style={{ flex: 1 }}>
            {/* Task name + focus level badge in the same row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{task.name}</span>

              {/* Focus badge uses CSS class based on level: badge-high, badge-medium, badge-low */}
              <span
                className={`badge-${task.focusLevel}`}
                style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20 }}
              >
                {task.focusLevel}
              </span>
            </div>

            {/* Secondary info row: date, time spent, category */}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 12 }}>
              <span>📅 {task.date}</span>
              <span>⏱ {task.timeSpent}h</span>
              <span style={{ color: 'var(--text-muted)' }}>{task.category}</span>
            </div>

            {/* Only render notes if they exist */}
            {task.notes && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                {task.notes}
              </p>
            )}
          </div>
        </div>

        {/* Right side: edit and delete action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(task)}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 6, color: 'var(--text-secondary)',
              padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem'
            }}
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(task.id)}
            style={{
              background: 'none', border: '1px solid rgba(255,80,80,0.2)',
              borderRadius: 6, color: '#ff5050',
              padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem'
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}