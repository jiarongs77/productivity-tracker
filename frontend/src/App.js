import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import WeeklySummary from './pages/WeeklySummary';
import HistoricalSearch from './pages/HistoricalSearch';
import TaskModal from './components/TaskModal';
import Nav from './components/Nav';

function App() {
  // ── State ────────────────────────────────────────────────────
  // Load tasks from localStorage on first render so data persists on refresh
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('productivity_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  // Tracks which page is currently visible (simple client-side routing)
  const [activePage, setActivePage] = useState('dashboard');

  // Controls whether the add/edit task modal is open
  const [modalOpen, setModalOpen] = useState(false);

  // Holds the task being edited — null means we're adding a new task
  const [editingTask, setEditingTask] = useState(null);

  // ── Persistence ───────────────────────────────────────────────
  // Every time tasks change, save them to localStorage
  // This ensures data survives page refreshes
  useEffect(() => {
    localStorage.setItem('productivity_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // ── Task handlers ─────────────────────────────────────────────
  // Either updates an existing task (if task.id exists) or adds a new one
  const handleSaveTask = (task) => {
    if (task.id) {
      // Edit: replace the matching task in the array
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    } else {
      // New: assign a unique ID using timestamp and append to array
      setTasks(prev => [...prev, { ...task, id: Date.now().toString() }]);
    }
    setModalOpen(false);
    setEditingTask(null);
  };

  // Remove a task by its ID
  const handleDeleteTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Open the modal pre-filled with the task being edited
  const handleEditTask = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Top navigation bar */}
      <Nav
        activePage={activePage}
        setActivePage={setActivePage}
        onAddTask={() => { setEditingTask(null); setModalOpen(true); }}
      />

      {/* Page content — renders based on activePage */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activePage === 'dashboard' && (
          <Dashboard tasks={tasks} onEdit={handleEditTask} onDelete={handleDeleteTask} />
        )}
        {activePage === 'weekly' && (
          <WeeklySummary tasks={tasks} />
        )}
        {activePage === 'history' && (
          <HistoricalSearch />
        )}
      </main>

      {/* Task modal — only rendered when modalOpen is true */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          onSave={handleSaveTask}
          onClose={() => { setModalOpen(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}

export default App;