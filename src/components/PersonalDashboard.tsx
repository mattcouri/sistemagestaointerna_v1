import React, { useState, useMemo, useRef } from 'react';
import { Plus, CheckSquare, CalendarX, Target, Search, CheckCheck } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ListColumn } from './ListColumn';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useListDragAndDrop } from '../hooks/useListDragAndDrop';
import { AddTaskModal } from './AddTaskModal';
import { CompletedTasksArchive } from './CompletedTasksArchive';

export function PersonalDashboard() {
  const { currentUser, createList, lists, allProfiles, projects, moveTask, reorderLists } = useApp();
  const { t } = useLanguage();
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const newListRef = useRef<HTMLDivElement>(null);
  const {
    draggedTask,
    dropTarget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleTaskDragOver,
    handleListAreaDragOver,
  } = useDragAndDrop();
  const {
    draggedList,
    dropTargetIndex,
    handleListDragStart,
    handleListDragEnd,
    handleListDragOver,
    handleListDrop,
  } = useListDragAndDrop();

  // Base: include lists owned by current user OR shared with current user
  // Exclude other users' private (non-shared, non-project) lists
  const allPersonalLists = useMemo(() => {
    if (!currentUser) return [];
    return lists.filter(l => {
      const isOwned = l.user_id === currentUser.id;
      const isSharedWithMe = !isOwned && (l.is_shared || (l.shared_with && l.shared_with.length > 0));
      return isOwned || isSharedWithMe;
    });
  }, [lists, currentUser]);

  const filteredLists = useMemo(() => {
    if (!currentUser) return [];
    let base = allPersonalLists;

    if (filterProject === '__personal') {
      base = base.filter(l =>
        l.user_id === currentUser.id &&
        !l.project_id &&
        !l.is_shared &&
        (!l.shared_with || l.shared_with.length === 0)
      );
    } else if (filterProject) {
      base = base.filter(l => l.project_id === filterProject);
    }

    return base.map(list => {
      const filtered = (list.tasks || []).filter((task: any) => {
        if (task.archived_at) return false;
        const matchSearch = !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchPriority = !filterPriority || task.priority === filterPriority;
        const matchAssignee = !filterAssignee || task.assigned_to === filterAssignee;
        return matchSearch && matchPriority && matchAssignee;
      });
      return { ...list, tasks: filtered };
    });
  }, [allPersonalLists, searchQuery, filterProject, filterPriority, filterAssignee, currentUser]);

  const kpiTasks = useMemo(() =>
    filteredLists.flatMap(l => (l.tasks || []).map((t: any) => ({ ...t, _listId: l.id, _projectId: l.project_id }))),
    [filteredLists]
  );

  const now = new Date();

  const kpiActive = kpiTasks.filter(t => !t.completed).length;
  const kpiCompleted = kpiTasks.filter(t => t.completed).length;
  const kpiOverdue = kpiTasks.filter(t => {
    if (t.completed) return false;
    const d = t.limit_date || t.due_date;
    if (!d) return false;
    return new Date(d) < now;
  }).length;
  const kpiHighPriority = kpiTasks.filter(t => !t.completed && t.priority === 'high').length;

  if (!currentUser) return null;

  if (showArchive) {
    return <CompletedTasksArchive onBack={() => setShowArchive(false)} />;
  }

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListTitle.trim()) {
      createList(newListTitle.trim(), 'personal');
      setNewListTitle('');
      setIsCreatingList(false);
    }
  };

  const handleDrop = (e: React.DragEvent, targetListId: string, targetIndex?: number) => {
    e.preventDefault();
    if (!draggedTask) { handleDragEnd(); return; }
    const { task, sourceListId } = draggedTask;
    handleDragEnd();
    moveTask(task.id, sourceListId, targetListId, targetIndex);
  };

  const handleListReorder = (sourceIndex: number, targetIndex: number) => {
    const newOrder = [...allPersonalLists];
    const [moved] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, moved);
    reorderLists(currentUser.id, newOrder.map(l => l.id));
  };

  const firstListId = allPersonalLists[0]?.id;

  const kpiCards = [
    {
      label: 'Active Tasks',
      value: kpiActive,
      icon: <CheckSquare className="w-8 h-8" />,
      border: 'border-blue-200 dark:border-blue-500/60',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      labelColor: 'text-blue-600 dark:text-blue-400',
      valueColor: 'text-blue-900 dark:text-white',
      iconColor: 'text-blue-300 dark:text-blue-400',
    },
    {
      label: 'Completed',
      value: kpiCompleted,
      icon: <CheckCheck className="w-8 h-8" />,
      border: 'border-green-200 dark:border-green-500/60',
      bg: 'bg-green-50 dark:bg-green-950/40',
      labelColor: 'text-green-600 dark:text-green-400',
      valueColor: 'text-green-900 dark:text-white',
      iconColor: 'text-green-300 dark:text-green-400',
    },
    {
      label: 'Overdue',
      value: kpiOverdue,
      icon: <CalendarX className="w-8 h-8" />,
      border: 'border-red-200 dark:border-red-500/60',
      bg: 'bg-red-50 dark:bg-red-950/40',
      labelColor: 'text-red-600 dark:text-red-400',
      valueColor: 'text-red-900 dark:text-white',
      iconColor: 'text-red-300 dark:text-red-400',
    },
    {
      label: 'High Priority',
      value: kpiHighPriority,
      icon: <Target className="w-8 h-8" />,
      border: 'border-orange-200 dark:border-orange-500/60',
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      labelColor: 'text-orange-600 dark:text-orange-400',
      valueColor: 'text-orange-900 dark:text-white',
      iconColor: 'text-orange-300 dark:text-orange-400',
    },
  ];

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <CheckSquare className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">To-Do Lists</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300">Manage your personal tasks and to-do lists</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowArchive(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              Completed Tasks
            </button>
            <button
              onClick={() => {
                setIsCreatingList(true);
                setTimeout(() => newListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' }), 50);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New List
            </button>
            {firstListId && (
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)' }}
              >
                <Plus className="w-4 h-4" />
                New Task
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {kpiCards.map((card) => (
            <div
              key={card.label}
              className={`${card.bg} ${card.border} border rounded-xl px-5 py-4 flex items-center justify-between`}
            >
              <div>
                <p className={`text-sm font-medium ${card.labelColor} mb-1`}>{card.label}</p>
                <p className={`text-3xl font-bold ${card.valueColor}`}>{card.value}</p>
              </div>
              <div className={card.iconColor}>{card.icon}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl px-5 py-4 mb-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Filter Tasks</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600/50 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              />
            </div>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600/50 rounded-lg text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 appearance-none"
            >
              <option value="">All Projects</option>
              <option value="__personal">Personal</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600/50 rounded-lg text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 appearance-none"
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600/50 rounded-lg text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 appearance-none"
            >
              <option value="">All Members</option>
              {allProfiles.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lists */}
        <div className="flex gap-6 overflow-x-auto pb-4">
          {filteredLists.map((list, index) => (
            <div
              key={list.id}
              className="flex items-stretch"
            >
              {dropTargetIndex === index && draggedList && draggedList.listId !== list.id && (
                <div className="w-1 rounded-full bg-blue-400 mr-3 my-1 flex-shrink-0 animate-pulse" />
              )}
              <div
                draggable
                onDragStart={(e) => { e.stopPropagation(); handleListDragStart(list.id, index); }}
                onDragEnd={handleListDragEnd}
                onDragOver={(e) => handleListDragOver(e, index)}
                onDrop={(e) => handleListDrop(e, index, handleListReorder)}
                className={`transition-all duration-150 cursor-grab active:cursor-grabbing ${
                  draggedList?.listId === list.id ? 'opacity-40 scale-95' : ''
                }`}
              >
                <ListColumn
                  list={list}
                  draggedTask={draggedTask}
                  dropTarget={dropTarget}
                  onTaskDragStart={handleDragStart}
                  onTaskDragEnd={handleDragEnd}
                  onTaskDragOver={handleTaskDragOver}
                  onListAreaDragOver={handleListAreaDragOver}
                  onDrop={handleDrop}
                  isPersonalDashboard={true}
                  projectUsers={list.type === 'project' && list.project_id ? allProfiles : undefined}
                />
              </div>
            </div>
          ))}

          {/* Create New List */}
          <div ref={newListRef} className="w-72 flex-shrink-0">
            {!isCreatingList ? (
              <button
                onClick={() => setIsCreatingList(true)}
                className="w-full h-28 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-400 dark:text-slate-500 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-500 dark:hover:text-slate-400 transition-all duration-200 flex flex-col items-center justify-center space-y-2"
              >
                <Plus className="w-6 h-6" />
                <span className="text-sm font-medium">{t('personal.createList')}</span>
              </button>
            ) : (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-md p-3">
                <form onSubmit={handleCreateList} className="space-y-2">
                  <input
                    type="text"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    placeholder="List title..."
                    className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 text-sm rounded-lg transition-colors"
                    >
                      {t('common.create')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsCreatingList(false); setNewListTitle(''); }}
                      className="flex-1 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 p-2 text-sm rounded-lg transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {showNewTaskModal && firstListId && (
        <AddTaskModal
          listId={firstListId}
          isPersonalDashboard={true}
          defaultAssignee={filterProject === '__personal' || !filterProject ? currentUser.id : undefined}
          onClose={() => setShowNewTaskModal(false)}
        />
      )}
    </div>
  );
}
