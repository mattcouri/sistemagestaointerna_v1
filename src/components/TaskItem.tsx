import React, { useState } from 'react';
import { Circle, CheckCircle2, User } from 'lucide-react';
import { Task, User as UserType } from '../types';
import { useApp } from '../contexts/AppContext';

interface TaskItemProps {
  task: Task;
  listId: string;
  compact?: boolean;
  projectUsers?: UserType[];
  onDragStart: (e: React.DragEvent) => void;
}

function priorityBarColor(priority: Task['priority']): string {
  switch (priority) {
    case 'high':   return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low':    return '#22c55e';
    default:       return '#64748b';
  }
}

function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TaskItem({ task, listId, compact = false, projectUsers, onDragStart }: TaskItemProps) {
  const { updateTask, deleteTask, allProfiles } = useApp();
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask(listId, task.id, { completed: !task.completed });
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      updateTask(listId, task.id, { title: editTitle.trim() });
    } else {
      setEditTitle(task.title);
    }
    setIsEditing(false);
  };

  const handleAssignUser = (userId: string) => {
    updateTask(listId, task.id, { assigned_to: userId || null });
    setShowAssigneeDropdown(false);
  };

  const assignedUser =
    (projectUsers ?? allProfiles)?.find(u => u.id === (task.assigned_to || (task as any).assignedTo));

  const displayDate = formatDate(task.limit_date || task.goal_date || task.due_date);
  const barColor = priorityBarColor(task.priority);

  return (
    <div className="relative">
      <div
        draggable
        onDragStart={onDragStart}
        className={`flex items-center gap-0 bg-[#252d3d] hover:bg-[#2a3347] rounded-lg cursor-move transition-colors overflow-hidden ${
          task.completed ? 'opacity-50' : ''
        }`}
        onDoubleClick={() => !compact && setIsEditing(true)}
      >
        {/* Priority color bar */}
        <div
          className="w-1 self-stretch flex-shrink-0 rounded-l-lg"
          style={{ backgroundColor: barColor, minHeight: '36px' }}
        />

        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className="flex-shrink-0 px-2.5 py-2.5 text-slate-400 hover:text-white transition-colors"
        >
          {task.completed ? (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>

        {/* Task title */}
        <div className="flex-1 min-w-0 py-2.5 pr-1">
          {isEditing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                else if (e.key === 'Escape') { setEditTitle(task.title); setIsEditing(false); }
              }}
              className="w-full text-sm bg-transparent border-b border-blue-400 text-white focus:outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={`text-sm font-medium truncate block ${
                task.completed ? 'line-through text-slate-500' : 'text-slate-100'
              }`}
            >
              {task.title}
            </span>
          )}
        </div>

        {/* Date */}
        {displayDate && (
          <span className="text-xs text-slate-400 flex-shrink-0 pl-1 pr-2 whitespace-nowrap">
            {displayDate}
          </span>
        )}

        {/* Assignee avatar */}
        <div className="flex-shrink-0 pr-2.5 relative">
          {assignedUser ? (
            <button
              onClick={(e) => { e.stopPropagation(); setShowAssigneeDropdown(!showAssigneeDropdown); }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-[#252d3d] hover:ring-blue-500 transition-all"
              style={{ backgroundColor: assignedUser.color }}
              title={assignedUser.name}
            >
              {assignedUser.name.charAt(0).toUpperCase()}
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setShowAssigneeDropdown(!showAssigneeDropdown); }}
              className="w-6 h-6 rounded-full bg-slate-600 hover:bg-slate-500 flex items-center justify-center transition-colors"
              title="Assign user"
            >
              <User className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Assignee dropdown */}
      {showAssigneeDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowAssigneeDropdown(false)} />
          <div className="absolute right-0 top-full mt-1 bg-[#1e2535] border border-slate-600/60 rounded-xl shadow-2xl z-50 min-w-40 max-h-48 overflow-y-auto">
            <button
              onClick={() => handleAssignUser('')}
              className="w-full text-left px-3 py-2.5 text-xs text-slate-300 hover:bg-slate-700/60 transition-colors"
            >
              Unassigned
            </button>
            {(projectUsers ?? allProfiles)?.map(user => (
              <button
                key={user.id}
                onClick={() => handleAssignUser(user.id)}
                className="w-full text-left px-3 py-2.5 text-xs text-slate-200 hover:bg-slate-700/60 transition-colors flex items-center gap-2.5"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{user.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
