import React, { useState } from 'react';
import { Calendar, CheckCircle2, Circle, Trash2, User, ChevronDown } from 'lucide-react';
import { Task, User as UserType } from '../types';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getPriorityColor } from '../utils/taskUtils';

interface TaskItemProps {
  task: Task;
  listId: string;
  compact?: boolean;
  projectUsers?: UserType[];
  onDragStart: (e: React.DragEvent) => void;
}

export function TaskItem({ task, listId, compact = false, projectUsers, onDragStart }: TaskItemProps) {
  const { updateTask, deleteTask } = useApp();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  
  const handleToggleComplete = () => {
    updateTask(listId, task.id, { completed: !task.completed });
  };

  const handleDelete = () => {
    deleteTask(listId, task.id);
  };

  const handleDoubleClick = () => {
    if (!compact) {
      setIsEditing(true);
      setEditTitle(task.title);
    }
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      updateTask(listId, task.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  const handleAssignUser = (userId: string) => {
    updateTask(listId, task.id, { assigned_to: userId || null });
    setShowAssigneeDropdown(false);
  };

  const priorityClass = getPriorityColor(task.priority);
  const assignedUser = projectUsers?.find(user => user.id === (task.assigned_to || (task as any).assignedTo));

  if (compact) {
    return (
      <div className="relative">
        <div
          draggable
          onDragStart={onDragStart}
          className={`flex items-center space-x-2 p-1.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 rounded border dark:border-slate-600 cursor-move transition-colors ${
            task.completed ? 'opacity-60' : ''
          }`}
        >
          <button
            onClick={handleToggleComplete}
            className="text-slate-600 hover:text-slate-800 transition-colors flex-shrink-0"
          >
            {task.completed ? (
              <CheckCircle2 className="w-3 h-3 text-green-600" />
            ) : (
              <Circle className="w-3 h-3" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleKeyDown}
                className="text-xs font-medium w-full bg-white border border-blue-500 rounded px-1"
                autoFocus
              />
            ) : (
              <p 
                className={`text-xs font-medium truncate cursor-pointer ${
                  task.completed ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-white'
                }`}
                onDoubleClick={handleDoubleClick}
              >
                {task.title}
              </p>
            )}
          </div>
          
          <span className={`px-1 py-0.5 text-xs rounded-full border ${priorityClass} flex-shrink-0`}>
            {task.priority.charAt(0).toUpperCase()}
          </span>
          
          {assignedUser && (
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 cursor-pointer"
              style={{ backgroundColor: assignedUser.color }}
              title={assignedUser.name}
              onClick={() => projectUsers && setShowAssigneeDropdown(!showAssigneeDropdown)}
            >
              {assignedUser.name.charAt(0)}
            </div>
          )}
          
          {!assignedUser && projectUsers && (
            <button
              onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
              className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 text-xs hover:bg-slate-400 transition-colors"
              title="Assign user"
            >
              <User className="w-3 h-3" />
            </button>
          )}
        </div>
        
        {showAssigneeDropdown && projectUsers && (
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-10 min-w-32">
            <button
              onClick={() => handleAssignUser('')}
              className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              Unassigned
            </button>
            {projectUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleAssignUser(user.id)}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center space-x-2"
              >
                <div 
                  className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name.charAt(0)}
                </div>
                <span>{user.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`p-3 bg-white dark:bg-slate-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-move border border-slate-200 dark:border-slate-600 ${
        task.completed ? 'opacity-75 bg-slate-50 dark:bg-slate-600' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <button
              onClick={handleToggleComplete}
              className="text-slate-600 hover:text-slate-800 transition-colors"
            >
              {task.completed ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
            </button>
            <span className="text-xs text-slate-400 font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded flex-shrink-0">
              #{task.tag}
            </span>
            {isEditing ? (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleKeyDown}
                className="text-sm font-semibold bg-white dark:bg-slate-600 dark:text-white border border-blue-500 rounded px-2 py-1 flex-1"
                autoFocus
              />
            ) : (
              <h4 
                className={`text-sm font-semibold cursor-pointer flex-1 ${
                  task.completed ? 'line-through text-gray-500 dark:text-slate-400' : 'text-slate-800 dark:text-white'
                }`}
                onDoubleClick={handleDoubleClick}
              >
                {task.title}
              </h4>
            )}
          </div>
          
          {task.description && (
            <p className={`text-xs text-slate-600 dark:text-slate-300 mb-2 ml-6 ${task.completed ? 'line-through' : ''}`}>
              {task.description}
            </p>
          )}
          
          <div className="flex items-center justify-between ml-6">
            <span className={`px-2 py-1 text-xs rounded-full ${priorityClass} font-medium`}>
              {task.priority}
            </span>
            
            <div className="flex items-center space-x-3">
              {task.dueDate && (
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <Calendar className="w-3 h-3 text-blue-500" />
                  <span>{task.dueDate.toLocaleDateString()}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2 relative">
                {assignedUser ? (
                  <div 
                    className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 rounded px-2 py-1 transition-colors"
                    onClick={() => projectUsers && setShowAssigneeDropdown(!showAssigneeDropdown)}
                  >
                    <div 
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: assignedUser.color }}
                      title={assignedUser.name}
                    >
                      {assignedUser.name.charAt(0)}
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">{assignedUser.name}</span>
                    {projectUsers && <ChevronDown className="w-3 h-3 text-blue-400" />}
                  </div>
                ) : projectUsers ? (
                  <button
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                    className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700 transition-colors px-2 py-1 hover:bg-slate-100 rounded"
                  >
                    <User className="w-4 h-4 text-green-500" />
                    <span>{t('task.assign')}</span>
                    {t('task.unassigned')}
                  </button>
                ) : null}
                
                {showAssigneeDropdown && projectUsers && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-50 min-w-40 max-h-40 overflow-y-auto">
                    <button
                      onClick={() => handleAssignUser('')}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                      {t('task.unassigned')}
                    </button>
                    {projectUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleAssignUser(user.id)}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center space-x-2"
                      >
                        <div 
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <span>{user.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleDelete}
          className="ml-2 text-slate-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      
      {/* Click outside to close dropdown */}
      {showAssigneeDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowAssigneeDropdown(false)}
        />
      )}
    </div>
  );
}