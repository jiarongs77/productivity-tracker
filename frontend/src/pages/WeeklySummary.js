import React, { useState } from 'react';
import axios from 'axios';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format } from 'date-fns';

// Backend URL — falls back to localhost for local development
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export default function WeeklySummary({ tasks }) {
  // ── State ─────────────────────────────────────────────────────
  const [summary, setSummary] = useState(null);   // AI-generated summary object
  const [loading, setLoading] = useState(false);  // Loading state for API call
  const [error, setError] = useState(null);       // Error message if API call fails
  const [saved, setSaved] = useState(false);      // Whether summary was saved to vector store

  // ── Filter tasks to current week ──────────────────────────────
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });     // Sunday

  const weekTasks = tasks.filter(t => {
    try { return isWithinInterval(parseISO(t.date), { start: weekStart, end: weekEnd }); }
    catch { return false; } // Skip tasks with invalid dates
  });

  // ── Build metrics object ──────────────────────────────────────
  // Aggregates task data into a structured summary sent to the backend
  const buildMetrics = () => {
    const totalHours = weekTasks.reduce((s, t) => s + t.timeSpent, 0);

    // Count tasks per focus level
    const focusCounts = { high: 0, medium: 0, low: 0 };

    // Count tasks per category
    const categoryCounts = {};

    weekTasks.forEach(t => {
      focusCounts[t.focusLevel]++;
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    return {
      week_start: format(weekStart, 'yyyy-MM-dd'),
      week_end: format(weekEnd, 'yyyy-MM-dd'),
      total_tasks: weekTasks.length,
      total_hours: parseFloat(totalHours.toFixed(1)),
      focus_counts: focusCounts,
      category_counts: categoryCounts,
      tasks: weekTasks,
    };
  };

  // ── Generate summary via backend ──────────────────────────────
  // Sends metrics to FastAPI which calls Anthropic Claude
  const generateSummary = async () => {
    if (weekTasks.length === 0) {
      setError('No tasks logged this week! Add some tasks first.');
      return;
    }
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const metrics = buildMetrics();
      // POST to /generate-summary endpoint on the backend
      const res = await axios.post(`${BACKEND_URL}/generate-summary`, metrics);
      // Store summary + metrics together so we can save them later
      setSummary({ ...res.data, metrics });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to connect to backend on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  // ── Save summary to vector store ──────────────────────────────
  // Sends the generated summary to the backend to be embedded and stored in FAISS
  const saveSummary = async () => {
    try {
      await axios.post(`${BACKEND_URL}/save-summary`, summary);
      setSaved(true);
    } catch {
      setError('Failed to save to vector store.');
    }
  };

  const metrics = buildMetrics();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 800, margin: '0 auto' }}>

      {/* Page heading */}
      <div>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 300 }}>Weekly Summary</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Week of {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
        </p>
      </div>

      {/* Quick stats for this week */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Tasks Completed', value: metrics.total_tasks },
          { label: 'Hours Logged', value: `${metrics.total_hours}h` },
          { label: 'High Focus Sessions', value: metrics.focus_counts.high },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '1.8rem', fontFamily: 'Fraunces, serif', color: 'var(--accent)', fontWeight: 300 }}>
              {s.value}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Generate button card — shows different UI based on state */}
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>

        {/* Default state — prompt user to generate */}
        {!summary && !loading && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🤖</div>
            <h3 style={{ margin: '0 0 8px', fontWeight: 400 }}>Generate AI Weekly Report</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 20px' }}>
              Claude will analyze your {weekTasks.length} tasks and generate a personalized summary.
            </p>
            <button
              className="btn-primary"
              onClick={generateSummary}
              style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}
            >
              Generate Summary
            </button>
          </>
        )}

        {/* Loading state */}
        {loading && (
          <p style={{ color: 'var(--text-secondary)' }}>
            ⚡ Analyzing your week with Claude AI...
          </p>
        )}

        {/* Error state */}
        {error && (
          <div style={{
            color: '#ff5050', background: 'rgba(255,80,80,0.1)',
            border: '1px solid rgba(255,80,80,0.2)', borderRadius: 8, padding: '1rem'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* AI summary output — only shown after successful generation */}
      {summary && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontWeight: 400 }}>
              <span style={{ color: 'var(--accent)', marginRight: 8 }}>✦</span>AI Summary
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
              claude-sonnet
            </span>
          </div>

          {/* Summary paragraph with left accent border */}
          <p style={{
            color: 'var(--text-primary)', lineHeight: 1.7, fontSize: '0.95rem',
            margin: '0 0 1.5rem', padding: '1rem', background: 'var(--bg-secondary)',
            borderRadius: 8, borderLeft: '3px solid var(--accent)'
          }}>
            {summary.summary}
          </p>

          {/* Suggestions list */}
          <h4 style={{
            margin: '0 0 0.75rem', color: 'var(--text-secondary)',
            fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            Suggestions for Next Week
          </h4>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {summary.suggestions?.map((s, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>→</span>{s}
              </li>
            ))}
          </ul>

          {/* Save to vector store + regenerate buttons */}
          <div style={{
            marginTop: '1.5rem', paddingTop: '1.5rem',
            borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center'
          }}>
            {/* Disable save button after saving to prevent duplicates */}
            <button className="btn-primary" onClick={saveSummary} disabled={saved}>
              {saved ? '✓ Saved to History' : 'Save to History'}
            </button>
            <button className="btn-ghost" onClick={() => { setSummary(null); setSaved(false); }}>
              Regenerate
            </button>
            {saved && (
              <span style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>
                Stored in vector database!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}