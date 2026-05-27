import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, startOfWeek, addDays } from 'date-fns';

// Custom tooltip shown when hovering over a bar
const CustomTooltip = ({ active, payload, label }) => {
  // Only render when tooltip is active and has data
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px'
    }}>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{label}</p>
      {/* Render one row per focus level (High/Medium/Low) */}
      {payload.map(p => (
        <p key={p.name} style={{ margin: '4px 0 0', fontSize: '0.85rem', color: p.color }}>
          {p.name}: {p.value}h
        </p>
      ))}
    </div>
  );
};

export default function FocusBarChart({ tasks }) {
  // ── Build chart data ──────────────────────────────────────────
  // Get the start of the current week (Monday)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  // Build one data point per day (Mon–Sun)
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const dayStr = format(day, 'yyyy-MM-dd');

    // Filter tasks that were logged on this specific day
    const dayTasks = tasks.filter(t => t.date === dayStr);

    // Sum hours by focus level for the stacked bar segments
    return {
      day: format(day, 'EEE'), // e.g. "Mon", "Tue"
      High: dayTasks
        .filter(t => t.focusLevel === 'high')
        .reduce((s, t) => s + t.timeSpent, 0),
      Medium: dayTasks
        .filter(t => t.focusLevel === 'medium')
        .reduce((s, t) => s + t.timeSpent, 0),
      Low: dayTasks
        .filter(t => t.focusLevel === 'low')
        .reduce((s, t) => s + t.timeSpent, 0),
    };
  });

  return (
    <div className="card">
      <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 500 }}>
        This Week — Hours by Focus Level
      </h3>

      {/* ResponsiveContainer makes the chart fill its parent width */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={days} barSize={22}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} unit="h" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '0.8rem' }} />

          {/* Stacked bars — each focus level is a segment */}
          {/* stackId="a" groups them into one stacked bar per day */}
          <Bar dataKey="High" stackId="a" fill="#c8f04a" />
          <Bar dataKey="Medium" stackId="a" fill="#ffcc4a" />
          <Bar dataKey="Low" stackId="a" fill="#ff7c4a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}