import React, { useState } from 'react';
import axios from 'axios';

// Backend URL — falls back to localhost for local development
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// Example queries to help users understand what they can search for
const EXAMPLE_QUERIES = [
  'Show me weeks when I completed a lot of coding tasks',
  'Find weeks with low focus and high hours',
  'When did I have the most productive weeks?',
  'Find weeks similar to this one with lots of meetings',
];

export default function HistoricalSearch() {
  // ── State ─────────────────────────────────────────────────────
  const [query, setQuery] = useState('');        // Current search input
  const [results, setResults] = useState(null);  // Search results from backend
  const [loading, setLoading] = useState(false); // Loading state during search
  const [error, setError] = useState(null);      // Error message if search fails

  // ── Search handler ────────────────────────────────────────────
  // Sends the query to the backend which searches the FAISS vector store
  const search = async () => {
    if (!query.trim()) return; // Don't search on empty input
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // POST query to /search-history endpoint
      // Backend embeds the query and finds similar weekly summaries
      const res = await axios.post(`${BACKEND_URL}/search-history`, { query });
      setResults(res.data.results);
    } catch (err) {
      setError(err.response?.data?.detail || 'Backend not reachable on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  // Allow pressing Enter to trigger search
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') search();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 800, margin: '0 auto' }}>

      {/* Page heading */}
      <div>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 300 }}>History Search</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Search past weeks using natural language. Powered by vector similarity search.
        </p>
      </div>

      {/* Search input card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            className="input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Show me weeks when I completed a lot of coding tasks"
            style={{ flex: 1 }}
          />
          <button
            className="btn-primary"
            onClick={search}
            disabled={loading}
            style={{ whiteSpace: 'nowrap' }}
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        {/* Example query chips — clicking fills the search input */}
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 8px' }}>Try:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EXAMPLE_QUERIES.map(q => (
              <button
                key={q}
                onClick={() => setQuery(q)} // Fill input with example query
                style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          color: '#ff5050', background: 'rgba(255,80,80,0.1)',
          border: '1px solid rgba(255,80,80,0.2)', borderRadius: 8,
          padding: '1rem', fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {/* Empty results state */}
      {results && results.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
          <p style={{ margin: 0 }}>
            No matching weeks found. Try saving some weekly summaries first.
          </p>
        </div>
      )}

      {/* Results list */}
      {results && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Result count */}
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Found <strong style={{ color: 'var(--accent)' }}>{results.length}</strong> similar week{results.length !== 1 ? 's' : ''}
          </p>

          {/* Individual result cards */}
          {results.map((result, i) => (
            <div key={i} className="card" style={{ padding: '1.5rem' }}>

              {/* Week date range + metadata badges */}
              <div style={{ marginBottom: '1rem' }}>
                {/* Week range in monospace font */}
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.8rem', color: 'var(--accent)' }}>
                  {result.week_start} → {result.week_end}
                </span>

                {/* Stats badges: task count, hours, similarity score */}
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.78rem', background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)', borderRadius: 20,
                    padding: '2px 10px', color: 'var(--text-secondary)'
                  }}>
                    {result.total_tasks} tasks
                  </span>
                  <span style={{
                    fontSize: '0.78rem', background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)', borderRadius: 20,
                    padding: '2px 10px', color: 'var(--text-secondary)'
                  }}>
                    {result.total_hours}h logged
                  </span>
                  {/* Similarity score — higher = closer match to the query */}
                  <span style={{
                    fontSize: '0.78rem', background: 'var(--accent-dim)',
                    border: '1px solid rgba(200,240,74,0.2)', borderRadius: 20,
                    padding: '2px 10px', color: 'var(--accent)'
                  }}>
                    {Math.round(result.similarity_score * 100)}% match
                  </span>
                </div>
              </div>

              {/* AI summary text for this week */}
              <p style={{
                margin: '0 0 1rem', color: 'var(--text-secondary)',
                fontSize: '0.88rem', lineHeight: 1.6
              }}>
                {result.summary}
              </p>

              {/* Show top 2 suggestions from that week */}
              {result.suggestions?.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <p style={{
                    fontSize: '0.75rem', color: 'var(--text-muted)',
                    margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    Suggestions from that week
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {result.suggestions.slice(0, 2).map((s, j) => (
                      <li key={j} style={{
                        fontSize: '0.82rem', color: 'var(--text-muted)',
                        display: 'flex', gap: 6
                      }}>
                        <span style={{ color: 'var(--accent)' }}>→</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}