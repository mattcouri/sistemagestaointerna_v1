import React, { useState, useMemo } from 'react';
import { ArrowLeft, CheckSquare, Calendar, Search, RotateCcw, Trash2, CheckCheck, FolderOpen, Lock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface CompletedTasksArchiveProps {
  onBack: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-green-400',
  none: 'bg-slate-300',
};

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function CompletedTasksArchive({ onBack }: CompletedTasksArchiveProps) {
  const { lists, projects, allProfiles, unarchiveTask, bulkDeleteArchivedTasks } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const personalLists = useMemo(() =>
    lists.filter(l => !l.project_id),
    [lists]
  );

  const allArchivedTasks = useMemo(() => {
    return personalLists.flatMap(l =>
      (l.tasks || [])
        .filter((t: any) => t.archived_at)
        .map((t: any) => ({ ...t, _listId: l.id, _listTitle: l.title, _listType: l.type }))
    );
  }, [personalLists]);

  const filteredByProject = useMemo(() => {
    if (!filterProject) return allArchivedTasks;
    if (filterProject === '__personal') return allArchivedTasks.filter((t: any) => {
      const list = lists.find(l => l.id === t._listId);
      return list && !list.project_id;
    });
    return allArchivedTasks.filter((t: any) => {
      const list = lists.find(l => l.id === t._listId);
      return list && list.project_id === filterProject;
    });
  }, [allArchivedTasks, filterProject, lists]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return filteredByProject;
    const q = searchQuery.toLowerCase();
    return filteredByProject.filter((t: any) => t.title.toLowerCase().includes(q));
  }, [filteredByProject, searchQuery]);

  const groupedByList = useMemo(() => {
    const map: Record<string, { list: any; tasks: any[] }> = {};
    for (const list of personalLists) {
      map[list.id] = { list, tasks: [] };
    }
    for (const task of filteredTasks) {
      if (map[task._listId]) {
        map[task._listId].tasks.push(task);
      }
    }
    return Object.values(map).sort((a, b) => a.list.position - b.list.position);
  }, [personalLists, filteredTasks]);

  const totalCompleted = allArchivedTasks.length;
  const today = new Date().toDateString();
  const completedToday = allArchivedTasks.filter((t: any) => t.archived_at && new Date(t.archived_at).toDateString() === today).length;

  function toggleSelect(taskId: string) {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function selectAll() {
    setSelectedTaskIds(new Set(filteredTasks.map((t: any) => t.id)));
  }

  function clearSelection() {
    setSelectedTaskIds(new Set());
  }

  async function handleUnarchive(listId: string, taskId: string) {
    await unarchiveTask(listId, taskId);
    setSelectedTaskIds(prev => { const n = new Set(prev); n.delete(taskId); return n; });
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedTaskIds);
    if (ids.length === 0) return;
    if (!confirm(`Permanently delete ${ids.length} task(s)? This cannot be undone.`)) return;
    setDeletingIds(new Set(ids));
    await bulkDeleteArchivedTasks(ids);
    setSelectedTaskIds(new Set());
    setDeletingIds(new Set());
  }

  async function handleDeleteSingle(taskId: string) {
    if (!confirm('Permanently delete this task? This cannot be undone.')) return;
    setDeletingIds(new Set([taskId]));
    await bulkDeleteArchivedTasks([taskId]);
    setSelectedTaskIds(prev => { const n = new Set(prev); n.delete(taskId); return n; });
    setDeletingIds(new Set());
  }

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to To-Do Lists
            </button>
            <div className="h-5 w-px bg-slate-300 dark:bg-slate-600" />
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-6 h-6 text-green-500" strokeWidth={2.5} />
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Completed Tasks Archive</h1>
            </div>
          </div>

          {selectedTaskIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">{selectedTaskIds.size} selected</span>
              <button
                onClick={clearSelection}
                className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected
              </button>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-500/60 rounded-xl px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Total Completed</p>
              <p className="text-4xl font-bold text-green-900 dark:text-white">{totalCompleted}</p>
            </div>
            <CheckSquare className="w-10 h-10 text-green-300 dark:text-green-400" />
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/60 rounded-xl px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Completed Today</p>
              <p className="text-4xl font-bold text-blue-900 dark:text-white">{completedToday}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-300 dark:text-blue-400" />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl px-5 py-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search completed tasks..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600/50 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
              />
            </div>
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="flex-1 min-w-0 max-w-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600/50 rounded-lg text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 appearance-none"
            >
              <option value="">All Lists</option>
              {personalLists.map(l => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
            {filteredTasks.length > 0 && (
              <button
                onClick={selectedTaskIds.size === filteredTasks.length ? clearSelection : selectAll}
                className="flex items-center gap-1.5 text-sm px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
              >
                <CheckCheck className="w-4 h-4" />
                {selectedTaskIds.size === filteredTasks.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>

        {/* Lists with archived tasks */}
        {allArchivedTasks.length === 0 ? (
          <div className="text-center py-20">
            <CheckSquare className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">No Archived Tasks</h3>
            <p className="text-slate-500 dark:text-slate-500">Complete and archive tasks from your To-Do Lists to see them here.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm overflow-hidden">
            <div className="flex gap-4 overflow-x-auto p-4">
              {groupedByList.map(({ list, tasks }) => (
                <div
                  key={list.id}
                  className="w-64 flex-shrink-0 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden"
                >
                  {/* Column header */}
                  <div className="px-4 py-3 bg-white dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">{list.title}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-2">{tasks.length}</span>
                  </div>

                  {/* Tasks */}
                  <div className="p-2 space-y-1.5 min-h-[80px]">
                    {tasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-slate-400 dark:text-slate-600">
                        <CheckSquare className="w-7 h-7 mb-1.5 opacity-40" />
                        <p className="text-xs">No completed tasks</p>
                      </div>
                    ) : tasks.map((task: any) => {
                      const isSelected = selectedTaskIds.has(task.id);
                      const isDeleting = deletingIds.has(task.id);
                      return (
                        <div
                          key={task.id}
                          onClick={() => toggleSelect(task.id)}
                          className={`group relative rounded-lg border px-3 py-2.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-950/30'
                              : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
                          } ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`w-1 rounded-full flex-shrink-0 mt-0.5 self-stretch ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.none}`} style={{ minHeight: '14px' }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-through truncate leading-tight">
                                {task.title}
                              </p>
                              {task.archived_at && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                  {formatDate(task.archived_at)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div
                            className="absolute top-1.5 right-1.5 hidden group-hover:flex items-center gap-1"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleUnarchive(task._listId, task.id)}
                              title="Return to active tasks"
                              className="p-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteSingle(task.id)}
                              title="Delete permanently"
                              className="p-1 rounded bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/60 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
