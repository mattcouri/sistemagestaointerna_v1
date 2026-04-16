import React, { useState } from 'react';
import { Plus, Target, Lock, FolderOpen, MoreVertical } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { TaskItem } from './TaskItem';
import { AddTaskModal } from './AddTaskModal';

interface ListColumnProps {
  list: any; // Using any since List type has mismatches
  onDragStart: (task: any, sourceListId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetListId: string) => void;
  compact?: boolean;
  projectUsers?: any[];
  isPersonalDashboard?: boolean;
}

export function ListColumn({ list, onDragStart, onDragOver, onDrop, compact = false, projectUsers, isPersonalDashboard = false }: ListColumnProps) {
  const { updateList, deleteList, projects, getProjectLists } = useApp();
  const { t } = useLanguage();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState(false);
  const [strategyText, setStrategyText] = useState(list.strategy || '');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(list.title);

  const project = list.project_id ? projects.find(p => p.id === list.project_id) : null;
  const projectLists = list.project_id ? getProjectLists(list.project_id) : [];

  const handleUpdateStrategy = () => {
    updateList(list.id, { strategy: strategyText });
    setEditingStrategy(false);
  };

  const handleUpdateTitle = () => {
    if (titleText.trim()) {
      updateList(list.id, { title: titleText.trim() });
      setEditingTitle(false);
    } else {
      setTitleText(list.title);
      setEditingTitle(false);
    }
  };

  const completedTasks = (list.tasks || []).filter(task => task.completed).length;
  const totalTasks = list.tasks?.length || 0;

  return (
    <div
      className={`${compact ? 'w-56' : 'w-72'} flex-shrink-0 ${
        list.type === 'project' 
          ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700' 
          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
      } rounded-lg shadow-sm overflow-hidden`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, list.id)}
    >
      {/* List Header */}
      <div className={`${compact ? 'p-2' : 'p-3'} ${
        list.type === 'project' 
          ? 'bg-slate-50 dark:bg-slate-700/50' 
          : 'bg-slate-50 dark:bg-slate-700/50'
      } border-b border-slate-200 dark:border-slate-600`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 flex-1">
            {list.type === 'project' ? (
              <FolderOpen className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            ) : (
              <Lock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            )}
            
            {editingTitle && !compact ? (
              <input
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
                onBlur={handleUpdateTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateTitle();
                  } else if (e.key === 'Escape') {
                    setTitleText(list.title);
                    setEditingTitle(false);
                  }
                }}
                className="flex-1 text-lg font-bold text-slate-800 dark:text-white bg-transparent border-b border-slate-300 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            ) : (
              <h3 
                className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-slate-800 dark:text-white flex-1 cursor-pointer`}
                onClick={() => !compact && setEditingTitle(true)}
              >
                {isPersonalDashboard && project ? project.name : list.title}
              </h3>
            )}
          </div>
          
          {!compact && (
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className={`text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors ${
                  (isPersonalDashboard && list.type === 'project') ? 'hidden' : ''
                }`}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-6 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-10 min-w-32">
                  <button
                    onClick={() => {
                      setEditingTitle(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    Rename List
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this list? All tasks will be lost.')) {
                        deleteList(list.id);
                      }
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete List
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>{completedTasks}/{totalTasks} completed</span>
          {list.type === 'project' && (
            <span className="text-xs px-2 py-1 bg-blue-500 text-white dark:bg-blue-600 rounded-full font-medium shadow-sm">
              SHARED
            </span>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Strategy Section */}
      <div className={`${compact ? 'p-2' : 'p-3'} bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className={`${compact ? 'text-xs' : 'text-xs'} font-medium text-blue-600 dark:text-blue-400`}>
              Strategy
            </span>
          </div>
          {!compact && (
            <button
              onClick={() => {
                if (editingStrategy) {
                  handleUpdateStrategy();
                } else {
                  setEditingStrategy(true);
                }
              }}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              {editingStrategy ? 'Save' : 'Edit'}
            </button>
          )}
        </div>
        
        {editingStrategy && !compact ? (
          <textarea
            value={strategyText}
            onChange={(e) => setStrategyText(e.target.value)}
            className="w-full p-2 text-xs bg-white dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            placeholder="Enter focus areas for this list..."
          />
        ) : (
          <p className={`${compact ? 'text-xs' : 'text-xs'} text-slate-600 dark:text-slate-300 italic font-bold ${!list.strategy ? 'text-slate-400 dark:text-slate-500' : ''}`}>
            {list.strategy || 'No strategy set'}
          </p>
        )}
      </div>

      {/* Tasks Section */}
      <div className={`${compact ? 'p-2' : 'p-3'} flex-1 bg-white dark:bg-slate-800`}>
        {!compact && !isAddingTask && (
          <button
            onClick={() => setIsAddingTask(true)}
            className="w-full p-2 mb-2 border-2 border-dashed rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <Plus className="w-3 h-3" />
            <span className="text-sm">Add Task</span>
          </button>
        )}

        {isAddingTask && !compact && (
          <AddTaskModal
            listId={list.id}
            listName={list.title}
            projectUsers={projectUsers}
            isPersonalDashboard={isPersonalDashboard}
            onClose={() => setIsAddingTask(false)}
          />
        )}

        {/* Task List */}
        <div className={`space-y-${compact ? '1' : '1'}`}>
          {(list.tasks || []).map((task: any) => (
            <TaskItem
              key={task.id}
              task={task}
              listId={list.id}
              compact={compact}
              projectUsers={projectUsers}
              onDragStart={(e) => onDragStart(task, list.id)}
            />
          ))}
          
          {(list.tasks?.length || 0) === 0 && (
            <div className={`${compact ? 'p-3 text-xs' : 'p-4 text-sm'} text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-600`}>
              <Target className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} mx-auto mb-1 text-slate-300 dark:text-slate-500`} />
              <p className="text-xs">No tasks yet</p>
              {!compact && <p className="text-xs mt-1">Add a task to get started</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}