import React, { useState, useEffect } from 'react';

// Available task categories shown in the dropdown
const CATEGORIES = ['Coding', 'Meeting', 'Design', 'Research', 'Writing', 'Admin', 'Other'];

// Focus levels shown as selectable buttons
const FOCUS_LEVELS = ['high', 'medium', 'low'];

export default function TaskModal({ task, onSave, onClose }) {
  // Default form state for a new task
  const [form, setForm] = useState({
    name: '',
    category: 'Coding',
    timeSpent: '',
    focusLevel: 'high',
    date: new Date().toISOString().split('T')[0], // Default to today
    notes: '',
  });

  // If a task is passed in (editing), pre-fill the form with its values
  useEffect(() => {
    if (task) setForm(task);
  }, [task]);

  // Generic change handler — updates whichever field changed by name
  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Validate required fields before saving
  const handleSubmit = () => {
    if (!form.name.trim() || !form.timeSpent) return;
    // Convert timeSpent to a number before saving
    onSave({ ...form, timeSpent: parseFloat(form.timeSpent) });
  };

  return (
    // Clicking the overlay (outside the modal box) closes the modal
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">

        {/* Header — title changes based on add vs edit mode */}
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.4rem', fontWeight: 300, margin: 0 }}>
            {task ? 'Edit Task' : 'Log a Task'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        <div className="flex flex-col gap-4">

          {/* Task name input */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Task Name *</label>
            <input
              className="input"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Wrote authentication module"
            />
          </div>

          {/* Date picker — defaults to today */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Date *</label>
            <input className="input" type="date" name="date" value={form.date} onChange={handleChange} />
          </div>

          {/* Category dropdown + time spent — side by side */}
          <div className="flex gap-3">
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Category</label>
              <select className="input" name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Time Spent (hrs) *</label>
              <input
                className="input"
                type="number"
                name="timeSpent"
                value={form.timeSpent}
                onChange={handleChange}
                placeholder="2.5"
                min="0.1"
                step="0.25"
              />
            </div>
          </div>

          {/* Focus level — rendered as clickable badge buttons */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Focus Level</label>
            <div className="flex gap-2">
              {FOCUS_LEVELS.map(level => (
                <button
                  key={level}
                  onClick={() => setForm(prev => ({ ...prev, focusLevel: level }))}
                  className={`badge-${level}`}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: 8, cursor: 'pointer',
                    // Selected level is fully opaque, others are dimmed
                    fontWeight: form.focusLevel === level ? 600 : 400,
                    fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif',
                    opacity: form.focusLevel === level ? 1 : 0.5,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Optional notes textarea */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Notes (optional)</label>
            <textarea
              className="input"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any context or blockers..."
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Cancel and save buttons */}
          <div className="flex gap-3 mt-2">
            <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit} style={{ flex: 2 }}>
              {task ? 'Save Changes' : 'Log Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}