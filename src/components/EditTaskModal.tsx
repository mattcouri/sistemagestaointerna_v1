import React, { useState, useEffect } from 'react';
import { X, Clock, Target, Calendar, AlertTriangle } from 'lucide-react';
import { Task, User } from '../types';
import { useApp } from '../contexts/AppContext';

interface EditTaskModalProps {
  task: Task;
  listId: string;
  projectUsers?: User[];
  onClose: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function EditTaskModal({ task, listId, projectUsers, onClose }: EditTaskModalProps) {
  const { updateTask, allProfiles } = useApp();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [startTime, setStartTime] = useState(task.start_time || '09:00');
  const [endTime, setEndTime] = useState(task.end_time || '10:00');
  const [durationMinutes, setDurationMinutes] = useState(task.duration_minutes ?? 60);
  const [noTimeAssigned, setNoTimeAssigned] = useState(task.no_time_assigned ?? false);
  const [useDuration, setUseDuration] = useState(task.use_duration ?? false);
  const [goalDate, setGoalDate] = useState(task.goal_date || '');
  const [limitDate, setLimitDate] = useState(task.limit_date || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task.priority || 'medium');
  const [assignee, setAssignee] = useState(task.assigned_to || '');
  const [submitting, setSubmitting] = useState(false);

  const users = projectUsers ?? allProfiles;

  const dateOrderError = goalDate && limitDate && goalDate > limitDate;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || dateOrderError) return;
    setSubmitting(true);
    try {
      const updates: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assigned_to: assignee || null,
        no_time_assigned: noTimeAssigned,
        use_duration: useDuration,
        goal_date: goalDate || null,
        limit_date: limitDate || null,
      };

      if (!noTimeAssigned) {
        updates.start_time = startTime;
        if (useDuration) {
          updates.duration_minutes = durationMinutes;
          updates.end_time = null;
        } else {
          updates.end_time = endTime;
          updates.duration_minutes = null;
        }
      } else {
        updates.start_time = null;
        updates.end_time = null;
        updates.duration_minutes = null;
      }

      await updateTask(listId, task.id, updates);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-[#1e2535] rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">Edit Task</h2>
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
                  noTimeAssigned ? 'bg-blue-500 border-blue-500' : 'border-slate-500 group-hover:border-slate-400'
                }`}
                onClick={() => setNoTimeAssigned(!noTimeAssigned)}
              >
                {noTimeAssigned && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <input type="checkbox" checked={noTimeAssigned} onChange={(e) => setNoTimeAssigned(e.target.checked)} className="sr-only" />
              <span className="text-sm text-slate-300">No time or duration assigned</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  useDuration ? 'bg-blue-500 border-blue-500' : 'border-slate-500 group-hover:border-slate-400'
                }`}
                onClick={() => setUseDuration(!useDuration)}
              >
                {useDuration && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <input type="checkbox" checked={useDuration} onChange={(e) => setUseDuration(e.target.checked)} className="sr-only" />
              <span className="text-sm text-slate-300">Use duration instead of end time</span>
            </label>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                <Target className="w-3.5 h-3.5 text-green-400" />
                Goal Date
              </label>
              <input
                type="date"
                value={goalDate}
                onChange={(e) => setGoalDate(e.target.value)}
                className={`w-full px-3 py-2.5 bg-[#2a3347] border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm [color-scheme:dark] ${
                  dateOrderError ? 'border-amber-500/80' : 'border-slate-600/50 focus:border-blue-500/50'
                }`}
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-400" />
                Limit Date
              </label>
              <input
                type="date"
                value={limitDate}
                onChange={(e) => setLimitDate(e.target.value)}
                className={`w-full px-3 py-2.5 bg-[#2a3347] border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm [color-scheme:dark] ${
                  dateOrderError ? 'border-amber-500/80' : 'border-slate-600/50 focus:border-blue-500/50'
                }`}
              />
            </div>
          </div>

          {dateOrderError && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 bg-amber-500/10 border border-amber-500/40 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 leading-relaxed">
                Goal date cannot be later than limit date. Please adjust the dates before saving.
              </p>
            </div>
          )}

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

          {users && users.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Assigned To</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#2a3347] border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm appearance-none"
              >
                <option value="">Unassigned</option>
                {users.map(u => (
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
              disabled={!title.trim() || !!dateOrderError || submitting}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)' }}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
