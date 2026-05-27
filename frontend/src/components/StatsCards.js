import React from 'react';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';

export default function StatsCards({ tasks }) {
  // ── Filter to current week only ───────────────────────────────
  // We use date-fns to get Monday as week start (weekStartsOn: 1)
  const now = new Date();
  const weekInterval = {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 })
  };

  // Filter tasks that fall within this week's date range
  const weekTasks = tasks.filter(t => {
    try { return isWithinInterval(parseISO(t.date), weekInterval); }
    catch { return false; } // Skip tasks with invalid dates
  });

  // ── Compute metrics ───────────────────────────────────────────
  // Sum up total hours logged this week
  const totalHours = weekTasks.reduce((s, t) => s + t.timeSpent, 0);

  // Find the most used category this week
  // Reduces tasks into a {category: count} map, then sorts to find the top one
  const topCategory = weekTasks.length
    ? Object.entries(
        weekTasks.reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0]
    : '—';

  // Find the most common focus level this week
  // Compares counts of high/medium/low to find the dominant one
  const dominantFocus = weekTasks.length
    ? ['high', 'medium', 'low'].reduce((best, level) =>
        weekTasks.filter(t => t.focusLevel === level).length >
        weekTasks.filter(t => t.focusLevel === best).length
          ? level : best
      , 'high')
    : '—';

  // ── Stats config ──────────────────────────────────────────────
  // Each stat has a label, computed value, and accent color
  const stats = [
    { label: 'Tasks This Week', value: weekTasks.length, accent: 'var(--accent)' },
    { label: 'Hours Logged', value: `${totalHours.toFixed(1)}h`, accent: 'var(--accent-blue)' },
    { label: 'Top Category', value: topCategory, accent: 'var(--accent-purple)' },
    {
      label: 'Dominant Focus',
      value: dominantFocus,
      // Color the focus value based on its level
      accent: dominantFocus === 'high'
        ? 'var(--focus-high)'
        : dominantFocus === 'medium'
        ? 'var(--focus-medium)'
        : 'var(--focus-low)'
    },
  ];

  return (
    // Responsive grid — cards wrap on smaller screens
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
      {stats.map(s => (
        <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
          {/* Large accent-colored value */}
          <div style={{ fontSize: '1.8rem', fontFamily: 'Fraunces, serif', color: s.accent, fontWeight: 300 }}>
            {s.value}
          </div>
          {/* Small label below the value */}
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}