import React, { useState, useEffect } from 'react';
import { X, Clock, Target, Calendar } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface AddTaskModalProps {
  listId: string;
  listName?: string;
  projectUsers?: any[];
  isPersonalDashboard?: boolean;
  onClose: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function AddTaskModal({ listId, listName, projectUsers, isPersonalDashboard, onClose }: AddTaskModalProps) {
  const { addTaskToList, projects, lists, getProjectLists } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [noTimeAssigned, setNoTimeAssigned] = useState(false);
  const [useDuration, setUseDuration] = useState(false);
  const [goalDate, setGoalDate] = useState('');
  const [limitDate, setLimitDate] = useState('');
  const [priority, setPriority] = useState<'none' | 'low' | 'medium' | 'high'>('none');
  const [assignee, setAssignee] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentList = lists.find(l => l.id === listId);
  const projectId = currentList?.project_id;
  const project = projectId ? projects.find(p => p.id === projectId) : null;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const taskData: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority: priority === 'none' ? 'medium' : priority,
        completed: false,
        assigned_to: assignee || undefined,
        no_time_assigned: noTimeAssigned,
        use_duration: useDuration,
        goal_date: goalDate || undefined,
        limit_date: limitDate || undefined,
      };

      if (!noTimeAssigned) {
        taskData.start_time = startTime;
        if (useDuration) {
          taskData.duration_minutes = durationMinutes;
        } else {
          taskData.end_time = endTime;
        }
      }

      await addTaskToList(listId, taskData);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const projectOptions = projects.filter(p =>
    lists.some(l => l.project_id === p.id)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-[#1e2535] rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">New ToDo Item</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              autoFocus
              className="w-full px-3 py-2.5 bg-[#2a3347] border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="w-full px-3 py-2.5 bg-[#2a3347] border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                <Clock className="w-3.5 h-3.5" />
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={noTimeAssigned}
                className="w-full px-3 py-2.5 bg-[#2a3347] border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              {useDuration ? (
                <>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Duration (min)</label>
                  <input
                    type="number"
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    disabled={noTimeAssigned}
                    className="w-full px-3 py-2.5 bg-[#2a3347] border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={noTimeAssigned}
                    className="w-full px-3 py-2.5 bg-[#2a3347] border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  noTimeAssigned
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-slate-500 group-hover:border-slate-400'
                }`}
                onClick={() => setNoTimeAssigned(!noTimeAssigned)}
              >
                {noTimeAssigned && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={noTimeAssigned}
                onChange={(e) => setNoTimeAssigned(e.target.checked)}
                className="sr-only"
              />
              <span className="text-sm text-slate-300">No time or duration assigned</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  useDuration
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-slate-500 group-hover:border-slate-400'
                }`}
                onClick={() => setUseDuration(!useDuration)}
              >
                {useDuration && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={useDuration}
                onChange={(e) => setUseDuration(e.target.checked)}
                className="sr-only"
              />
              <span className="text-sm text-slate-300">Use duration instead of end time</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                <Target className="w-3.5 h-3.5" />
                Goal Date
              </label>
              <input
                type="date"
                value={goalDate}
                onChange={(e) => setGoalDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#2a3347] border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Limit Date
              </label>
              <input
                type="date"
                value={limitDate}
                onChange={(e) => setLimitDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#2a3347] border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-[#2a3347] border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm appearance-none"
            >
              {PRIORITY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {project && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Project</label>
              <div className="w-full px-3 py-2.5 bg-[#2a3347] border border-slate-600/50 rounded-lg text-white text-sm">
                {project.name}
              </div>
            </div>
          )}

          {!project && projectOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Project</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#2a3347] border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm appearance-none"
              >
                <option value="">Personal</option>
                {projectOptions.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {projectUsers && projectUsers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Assigned To</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#2a3347] border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm appearance-none"
              >
                <option value="">Unassigned</option>
                {projectUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || submitting}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)' }}
            >
              {submitting ? 'Creating...' : 'Create ToDo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
