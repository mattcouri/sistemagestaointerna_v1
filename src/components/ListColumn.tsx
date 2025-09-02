import React, { useState } from 'react';
import { Plus, Target, Lock, FolderOpen, MoreVertical, User } from 'lucide-react';
import { List, Task, User as UserType } from '../types';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { TaskItem } from './TaskItem';

interface ListColumnProps {
  list: List;
  onDragStart: (task: Task, sourceListId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetListId: string) => void;
  compact?: boolean;
  projectUsers?: UserType[];
  isPersonalDashboard?: boolean;
}

export function ListColumn({ list, onDragStart, onDragOver, onDrop, compact = false, projectUsers, isPersonalDashboard = false }: ListColumnProps) {
  const { updateList, addTaskToList, deleteList, projects, getProjectLists } = useApp();
  const { t } = useLanguage();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');
  const [selectedTargetList, setSelectedTargetList] = useState<string>('');
  const [editingStrategy, setEditingStrategy] = useState(false);
  const [strategyText, setStrategyText] = useState(list.strategy);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(list.title);

  // Get project info if this is a project list
  const project = list.projectId ? projects.find(p => p.id === list.projectId) : null;
  const projectLists = list.projectId ? getProjectLists(list.projectId) : [];
  
  // Set default target list when adding task
  React.useEffect(() => {
    if (isAddingTask && list.projectId && !selectedTargetList) {
      setSelectedTargetList(list.id);
    }
  }, [isAddingTask, list.projectId, list.id, selectedTargetList]);
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      const targetListId = isPersonalDashboard && list.projectId && selectedTargetList 
        ? selectedTargetList 
        : list.id;
        
      addTaskToList(targetListId, {
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        completed: false,
        assignedTo: newTaskAssignee || undefined,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate) : undefined
      });
      setNewTaskTitle('');
      setNewTaskAssignee('');
      setNewTaskDueDate('');
      setSelectedTargetList('');
      setIsAddingTask(false);
    }
  };

  const handleUpdateStrategy = () => {
    updateList(list.id, { strategy: strategyText });
    setEditingStrategy(false);
  };

  const handleUpdateTitle = () => {
    if (titleText.trim()) {
      updateList(list.id, { title: titleText.trim() });
      setEditingTitle(false);
    } else {
      // Reset to original title if empty
      setTitleText(list.title);
      setEditingTitle(false);
    }
  };

  const completedTasks = list.tasks.filter(task => task.completed).length;
  const totalTasks = list.tasks.length;

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
              {t('personal.shared')}
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
      <div className={`${compact ? 'p-2' : 'p-3'} ${
        list.type === 'project' 
          ? 'bg-white dark:bg-slate-800' 
          : 'bg-white dark:bg-slate-800'
      } border-b border-slate-200 dark:border-slate-600`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className={`${compact ? 'text-xs' : 'text-xs'} font-medium text-blue-600 dark:text-blue-400`}>
              {t('personal.strategy')}
            </span>
          </div>
          {!compact && (
            <button
              onClick={() => setEditingStrategy(!editingStrategy)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors text-xs"
            >
              {editingStrategy ? 'Save' : 'Edit'}
            </button>
          )}
        </div>
        
        {editingStrategy && !compact ? (
          <div>
            <textarea
              value={strategyText}
              onChange={(e) => setStrategyText(e.target.value)}
              className="w-full p-2 text-xs bg-white dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Enter focus areas for this list..."
            />
            <button
              onClick={handleUpdateStrategy}
              className="mt-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
            >
              Save Strategy
            </button>
          </div>
        ) : (
          <p className={`${compact ? 'text-xs' : 'text-xs'} text-slate-600 dark:text-slate-300 italic font-bold ${!list.strategy ? 'text-slate-400 dark:text-slate-500' : ''}`}>
            {list.strategy || t('personal.noStrategy')}
          </p>
        )}
      </div>

      {/* Tasks Section */}
      <div className={`${compact ? 'p-2' : 'p-3'} flex-1 ${
        list.type === 'project' 
          ? 'bg-white dark:bg-slate-800' 
          : 'bg-white dark:bg-slate-800'
      }`}>
        {!compact && !isAddingTask && (
          <button
            onClick={() => setIsAddingTask(true)}
            className={`w-full p-2 mb-2 border-2 border-dashed rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
              list.type === 'project'
                ? 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Plus className="w-3 h-3" />
            <span className="text-sm">{t('task.addTask')}</span>
          </button>
        )}

        {isAddingTask && !compact && (
          <form onSubmit={handleAddTask} className={`space-y-2 mb-2 p-3 rounded-lg ${
            list.type === 'project' 
              ? 'bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600' 
              : 'bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600'
          }`}>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full p-2 text-sm border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-600 dark:text-white"
              autoFocus
            />
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
              className="w-full p-2 text-sm border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-600 dark:text-white"
            >
              <option value="low">{t('task.lowPriority')}</option>
              <option value="medium">{t('task.mediumPriority')}</option>
              <option value="high">{t('task.highPriority')}</option>
            </select>
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="w-full p-2 text-sm border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-600 dark:text-white"
              placeholder="Due date (optional)"
            />
            {isPersonalDashboard && list.projectId && projectLists.length > 1 && (
              <select
                value={selectedTargetList}
                onChange={(e) => setSelectedTargetList(e.target.value)}
                className="w-full p-2 text-sm border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-600 dark:text-white"
                required
              >
                <option value="">Select list...</option>
                {projectLists.map(pList => (
                  <option key={pList.id} value={pList.id}>
                    {pList.title} ({pList.tasks.length} tasks)
                  </option>
                ))}
              </select>
            )}
            {projectUsers && projectUsers.length > 0 && (
              <select
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="w-full p-2 text-sm border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-600 dark:text-white"
              >
                <option value="">{t('task.unassigned')}</option>
                {projectUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            )}
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 text-sm rounded-lg transition-colors"
              >
                {t('common.create')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTaskTitle('');
                  setNewTaskDueDate('');
                }}
                className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-700 p-2 text-sm rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        )}

        {/* Task List */}
        <div className={`space-y-${compact ? '1' : '1'}`}>
          {list.tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              listId={list.id}
              compact={compact}
              projectUsers={projectUsers}
              onDragStart={(e) => onDragStart(task, list.id)}
            />
          ))}
          
          {list.tasks.length === 0 && (
            <div className={`${compact ? 'p-3 text-xs' : 'p-4 text-sm'} text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-600`}>
              <Target className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} mx-auto mb-1 text-slate-300 dark:text-slate-500`} />
              <p className="text-xs">{t('personal.noTasks')}</p>
              {!compact && <p className="text-xs mt-1">{t('personal.getStarted')}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}