import React, { useState } from 'react';
import { Plus, Target, Lock, FolderOpen, MoreVertical, Share2, Archive as ArchiveIcon } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { TaskItem } from './TaskItem';
import { AddTaskModal } from './AddTaskModal';
import { ShareListModal } from './ShareListModal';

interface ListColumnProps {
  list: any;
  draggedTask: { task: any; sourceListId: string } | null;
  dropTarget: { listId: string; index: number } | null;
  onTaskDragStart: (task: any, sourceListId: string) => void;
  onTaskDragEnd: () => void;
  onTaskDragOver: (e: React.DragEvent, listId: string, index: number) => void;
  onListAreaDragOver: (e: React.DragEvent, listId: string, taskCount: number) => void;
  onDrop: (e: React.DragEvent, targetListId: string, targetIndex?: number) => void;
  compact?: boolean;
  projectUsers?: any[];
  isPersonalDashboard?: boolean;
}

export function ListColumn({
  list,
  draggedTask,
  dropTarget,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskDragOver,
  onListAreaDragOver,
  onDrop,
  compact = false,
  projectUsers,
  isPersonalDashboard = false,
}: ListColumnProps) {
  const { updateList, deleteList, projects, allProfiles, currentUser, archiveCompletedTasks } = useApp();
  const { t } = useLanguage();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState(false);
  const [strategyText, setStrategyText] = useState(list.strategy || '');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(list.title);

  const project = list.project_id ? projects.find((p: any) => p.id === list.project_id) : null;

  const isShared = !!(list.is_shared || (list.shared_with && list.shared_with.length > 0));
  const isOwner = list.user_id === currentUser?.id;
  const sharedWithUsers = (list.shared_with || [])
    .map((uid: string) => allProfiles.find((u: any) => u.id === uid))
    .filter(Boolean);

  const tasks: any[] = list.tasks || [];
  const isDraggingOver = dropTarget?.listId === list.id;

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

  const completedTasks = tasks.filter((task: any) => task.completed).length;
  const archivableTasks = tasks.filter((task: any) => task.completed && !task.archived_at).length;

  const handleArchiveCompleted = async () => {
    if (archivableTasks === 0) return;
    if (!confirm(`Move ${archivableTasks} completed task(s) to the archive?`)) return;
    await archiveCompletedTasks(list.id);
  };

  const sharedBorderClass = isShared
    ? 'border-2 border-blue-400/70 dark:border-blue-500/70 shadow-[0_0_12px_rgba(59,130,246,0.12)] dark:shadow-[0_0_12px_rgba(59,130,246,0.2)]'
    : 'border border-slate-200 dark:border-slate-700/60';

  const showDropIndicator = (index: number) =>
    isDraggingOver && dropTarget?.index === index && !!draggedTask;

  return (
    <>
      <div
        className={`${compact ? 'w-56' : 'w-72'} flex-shrink-0 bg-white dark:bg-[#1e2535] ${sharedBorderClass} rounded-xl shadow-sm overflow-hidden`}
      >
        {/* List Header */}
        <div className={`${compact ? 'p-2' : 'p-3'} ${isShared ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-slate-50 dark:bg-slate-800/50'} border-b border-slate-200 dark:border-slate-700/50`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {list.type === 'project' ? (
                <FolderOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
              ) : isShared ? (
                <Share2 className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
              ) : (
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-400 flex-shrink-0" />
              )}

              {editingTitle && !compact ? (
                <input
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  onBlur={handleUpdateTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateTitle();
                    else if (e.key === 'Escape') { setTitleText(list.title); setEditingTitle(false); }
                  }}
                  className="flex-1 text-base font-bold text-slate-800 dark:text-white bg-transparent border-b border-slate-400 dark:border-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                  autoFocus
                />
              ) : project ? (
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider truncate leading-tight">
                    {project.name}
                  </p>
                  <h3
                    className={`${compact ? 'text-sm' : 'text-base'} font-bold text-slate-800 dark:text-white truncate cursor-pointer leading-tight`}
                    onClick={() => !compact && isOwner && setEditingTitle(true)}
                  >
                    {list.title}
                  </h3>
                </div>
              ) : (
                <h3
                  className={`${compact ? 'text-sm' : 'text-base'} font-bold text-slate-800 dark:text-white flex-1 truncate cursor-pointer`}
                  onClick={() => !compact && isOwner && setEditingTitle(true)}
                >
                  {list.title}
                </h3>
              )}
            </div>

            {!compact && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className={`text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1 rounded ${
                    (isPersonalDashboard && list.type === 'project') ? 'hidden' : ''
                  }`}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-7 bg-white dark:bg-[#1e2535] border border-slate-200 dark:border-slate-600/60 rounded-xl shadow-2xl z-20 min-w-40 overflow-hidden">
                    {isOwner && (
                      <button
                        onClick={() => { setEditingTitle(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                      >
                        Rename List
                      </button>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => { setShowShareModal(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors flex items-center gap-2"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Share List
                      </button>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => {
                          if (confirm('Delete this list? All tasks will be lost.')) deleteList(list.id);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        Delete List
                      </button>
                    )}
                    {!isOwner && (
                      <div className="px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500 italic">Read-only (shared)</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>{completedTasks}/{tasks.length} completed</span>
              {!compact && archivableTasks > 0 && (
                <button
                  onClick={handleArchiveCompleted}
                  title={`Archive ${archivableTasks} completed task(s)`}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
                >
                  <ArchiveIcon className="w-3 h-3" />
                  Archive {archivableTasks}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {list.type === 'project' && (
                <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full font-medium text-[10px] uppercase tracking-wide">
                  Project
                </span>
              )}
              {isShared && list.type !== 'project' && (
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1">
                    {sharedWithUsers.slice(0, 3).map((u: any) => (
                      <div
                        key={u.id}
                        title={u.name}
                        className="w-5 h-5 rounded-full border border-white dark:border-slate-800 flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ backgroundColor: u.color || '#3B82F6' }}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {sharedWithUsers.length > 3 && (
                      <div className="w-5 h-5 rounded-full border border-white dark:border-slate-800 bg-slate-400 dark:bg-slate-600 flex items-center justify-center text-[9px] text-white font-bold">
                        +{sharedWithUsers.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-blue-500 dark:text-blue-400 font-medium uppercase tracking-wide">Shared</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {showMenu && (
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
        )}

        {/* Strategy Section */}
        <div className={`${compact ? 'p-2' : 'p-3'} bg-slate-50 dark:bg-[#1e2535] border-b border-slate-200 dark:border-slate-700/50`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-1.5">
              <Target className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Strategy</span>
            </div>
            {!compact && isOwner && (
              <button
                onClick={() => {
                  if (editingStrategy) handleUpdateStrategy();
                  else setEditingStrategy(true);
                }}
                className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {editingStrategy ? 'Save' : 'Edit'}
              </button>
            )}
          </div>

          {editingStrategy && !compact ? (
            <textarea
              value={strategyText}
              onChange={(e) => setStrategyText(e.target.value)}
              className="w-full p-2 text-xs bg-slate-100 dark:bg-[#2a3347] text-slate-800 dark:text-white border border-slate-300 dark:border-slate-600/50 rounded resize-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              rows={2}
              placeholder="Enter focus areas for this list..."
            />
          ) : (
            <p className={`text-xs italic ${list.strategy ? 'text-slate-700 dark:text-slate-300 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
              {list.strategy || 'No strategy set'}
            </p>
          )}
        </div>

        {/* Tasks Section */}
        <div
          className={`${compact ? 'p-2' : 'p-3'} bg-white dark:bg-[#1e2535] transition-colors ${
            isDraggingOver && tasks.length === 0 ? 'bg-blue-50 dark:bg-blue-950/20' : ''
          }`}
          onDragOver={(e) => onListAreaDragOver(e, list.id, tasks.length)}
          onDrop={(e) => { e.preventDefault(); onDrop(e, list.id, dropTarget?.listId === list.id ? dropTarget.index : undefined); }}
        >
          {!compact && !isAddingTask && (
            <button
              onClick={() => setIsAddingTask(true)}
              className="w-full p-2 mb-2 border-2 border-dashed rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-500 dark:hover:text-slate-400"
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

          <div className="space-y-0">
            {/* Drop indicator at top */}
            <DropLine visible={showDropIndicator(0)} />

            {tasks.map((task: any, index: number) => (
              <div
                key={task.id}
                onDragOver={(e) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const midY = rect.top + rect.height / 2;
                  const insertIndex = e.clientY < midY ? index : index + 1;
                  onTaskDragOver(e, list.id, insertIndex);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const midY = rect.top + rect.height / 2;
                  const insertIndex = e.clientY < midY ? index : index + 1;
                  onDrop(e, list.id, insertIndex);
                }}
                className="relative"
              >
                <div className="mb-1">
                  <TaskItem
                    task={task}
                    listId={list.id}
                    compact={compact}
                    projectUsers={projectUsers}
                    isDragging={draggedTask?.task.id === task.id}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      onTaskDragStart(task, list.id);
                    }}
                    onDragEnd={onTaskDragEnd}
                  />
                </div>
                <DropLine visible={showDropIndicator(index + 1)} />
              </div>
            ))}

            {tasks.length === 0 && (
              <div
                className={`${compact ? 'p-3 text-xs' : 'p-4 text-sm'} text-center text-slate-500 rounded-lg border-2 border-dashed transition-colors ${
                  isDraggingOver ? 'border-blue-400/60 bg-blue-50 dark:bg-blue-950/20 text-blue-500 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-500'
                }`}
              >
                <Target className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} mx-auto mb-1 ${isDraggingOver ? 'text-blue-500' : 'text-slate-400 dark:text-slate-600'}`} />
                <p className="text-xs">{isDraggingOver ? 'Drop here' : 'No tasks yet'}</p>
                {!compact && !isDraggingOver && <p className="text-xs mt-1 text-slate-400 dark:text-slate-600">Add a task to get started</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {showShareModal && (
        <ShareListModal
          list={list}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}

function DropLine({ visible }: { visible: boolean }) {
  return (
    <div
      className={`h-0.5 rounded-full mx-1 transition-all duration-150 ${
        visible ? 'bg-blue-400 opacity-100 mb-1' : 'bg-transparent opacity-0 mb-0'
      }`}
    />
  );
}
