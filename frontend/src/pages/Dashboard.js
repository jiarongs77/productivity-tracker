import React, { useState } from 'react';
import TaskCard from '../components/TaskCard';
import FocusBarChart from '../components/FocusBarChart';
import ActivityHeatmap from '../components/ActivityHeatmap';
import StatsCards from '../components/StatsCards';

export default function Dashboard({ tasks, onEdit, onDelete }) {
  // ── Filter + sort state ───────────────────────────────────────
  // Filter by focus level — 'all' shows everything
  const [filter, setFilter] = useState('all');

  // Sort tasks by date (newest first) or time spent (highest first)
  const [sortBy, setSortBy] = useState('date');

  // ── Apply filter and sort ─────────────────────────────────────
  const filtered = tasks
    .filter(t => filter === 'all' || t.focusLevel === filter)
    .sort((a, b) =>
      sortBy === 'date'
        ? b.date.localeCompare(a.date)       // Newest date first
        : b.timeSpent - a.timeSpent          // Most hours first
    );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Page heading */}
      <div>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 300 }}>Your Productivity</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Track tasks, visualize patterns, stay in flow.
        </p>
      </div>

      {/* Top stats row — shows this week's summary numbers */}
      <StatsCards tasks={tasks} />

      {/* Charts row — bar chart and heatmap side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Bar chart shows focus level breakdown for current week */}
        <FocusBarChart tasks={tasks} />
        {/* Heatmap shows activity over the last 13 weeks */}
        <ActivityHeatmap tasks={tasks} />
      </div>

      {/* Task list card */}
      <div className="card" style={{ padding: '1.5rem' }}>

        {/* List header with filter and sort controls */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>All Tasks</h3>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Focus level filter buttons */}
            <div className="flex gap-1">
              {['all', 'high', 'medium', 'low'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', cursor: 'pointer',
                    // Active filter gets accent style, others get ghost style
                    border: filter === f ? 'none' : '1px solid var(--border)',
                    background: filter === f ? 'var(--accent-dim)' : 'transparent',
                    color: filter === f ? 'var(--accent)' : 'var(--text-secondary)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Sort dropdown */}
            <select
              className="input"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ width: 'auto', fontSize: '0.8rem', padding: '4px 10px' }}
            >
              <option value="date">Sort: Date</option>
              <option value="time">Sort: Time Spent</option>
            </select>
          </div>
        </div>

        {/* Empty state — shown when no tasks match the filter */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
            <p style={{ margin: 0 }}>
              No tasks yet. Hit <strong style={{ color: 'var(--accent)' }}>+ Add Task</strong> to start logging.
            </p>
          </div>
        ) : (
          // Render a TaskCard for each filtered and sorted task
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map(task => (
              <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}