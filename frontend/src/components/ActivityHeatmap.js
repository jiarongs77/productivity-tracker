import React from 'react';
import { format, subWeeks, startOfWeek, addDays, parseISO } from 'date-fns';

// Returns a color based on total hours logged that day
// More hours = more opaque green, matching GitHub-style heatmap
function getColor(hours) {
  if (hours === 0) return 'var(--bg-hover)';        // No activity
  if (hours < 2) return 'rgba(200, 240, 74, 0.25)'; // Light activity
  if (hours < 4) return 'rgba(200, 240, 74, 0.5)';  // Moderate activity
  if (hours < 6) return 'rgba(200, 240, 74, 0.75)'; // Good activity
  return 'var(--accent)';                            // High activity (6h+)
}

export default function ActivityHeatmap({ tasks }) {
  const WEEKS = 13; // Show ~3 months of history
  const today = new Date();

  // Calculate the Monday that starts our 13-week grid
  const gridStart = startOfWeek(subWeeks(today, WEEKS - 1), { weekStartsOn: 1 });

  // ── Build hours map ───────────────────────────────────────────
  // Create a lookup of { "YYYY-MM-DD": totalHours } for quick access
  const hoursMap = {};
  tasks.forEach(t => {
    hoursMap[t.date] = (hoursMap[t.date] || 0) + t.timeSpent;
  });

  // ── Build grid ────────────────────────────────────────────────
  // Outer array = weeks (columns), inner array = days Mon-Sun (rows)
  const weeks = Array.from({ length: WEEKS }, (_, wi) =>
    Array.from({ length: 7 }, (_, di) => {
      const date = addDays(addDays(gridStart, wi * 7), di);
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        date: dateStr,
        hours: hoursMap[dateStr] || 0,    // 0 if no tasks that day
        label: format(date, 'MMM d'),     // Used in tooltip e.g. "Jan 6"
      };
    })
  );

  // Day labels shown on the left side of the heatmap
  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="card">
      <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 500 }}>
        Activity Heatmap — Last 13 Weeks
      </h3>

      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>

        {/* Day labels column (M T W T F S S) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 20 }}>
          {DAY_LABELS.map((d, i) => (
            <span key={i} style={{
              fontSize: '0.65rem', color: 'var(--text-muted)',
              width: 10, textAlign: 'center', height: 14, lineHeight: '14px'
            }}>
              {d}
            </span>
          ))}
        </div>

        {/* Heatmap grid — scrollable horizontally on small screens */}
        <div style={{ overflowX: 'auto', flex: 1 }}>

          {/* Month labels row above the grid */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ width: 14, fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                {/* Only show month label at start or when day <= 7 (new month) */}
                {wi === 0 || format(parseISO(week[0].date), 'd') <= '7'
                  ? format(parseISO(week[0].date), 'MMM')
                  : ''}
              </div>
            ))}
          </div>

          {/* Grid of colored cells — one per day */}
          <div style={{ display: 'flex', gap: 3 }}>
            {weeks.map((week, wi) => (
              // Each column = one week
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {week.map((cell, di) => (
                  // Each cell = one day, colored by hours logged
                  // title shows tooltip on hover e.g. "Jan 6: 3h"
                  <div
                    key={di}
                    className="heatmap-cell"
                    title={`${cell.label}: ${cell.hours}h`}
                    style={{ background: getColor(cell.hours) }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend showing color scale from less to more */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Less</span>
        {[0, 1, 2, 4, 6].map(h => (
          <div key={h} className="heatmap-cell" style={{ background: getColor(h) }} />
        ))}
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>More</span>
      </div>
    </div>
  );
}