import React, { useState, useEffect } from 'react';
import { ArrowLeft, Monitor, Users, Target, Plus, User, CheckSquare } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ListColumn } from './ListColumn';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useListDragAndDrop } from '../hooks/useListDragAndDrop';
import { ProjectTasksArchive } from './ProjectTasksArchive';

interface ProjectViewProps {
  project: any; // Using any since Project type may have mismatches
  onBack: () => void;
  onTVDashboard: () => void;
}

export function ProjectView({ project, onBack, onTVDashboard }: ProjectViewProps) {
  const { getProjectLists, getUsersInProject, moveTask, createList, reorderProjectLists } = useApp();
  const { t } = useLanguage();
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [showArchive, setShowArchive] = useState(false);
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
    handleListDrop
  } = useListDragAndDrop();

  const rawProjectLists = getProjectLists(project.id);
  const projectLists = rawProjectLists.map(l => ({
    ...l,
    tasks: (l.tasks || []).filter((t: any) => !t.archived_at),
  }));
  const projectUsers = getUsersInProject(project.id);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newListTitle.trim()) {
      try {
        console.log('Creating list with projectId:', project.id);
        await createList(newListTitle.trim(), 'project', project.id);
        setNewListTitle('');
        setIsCreatingList(false);
      } catch (error) {
        console.error('Error creating list:', error);
      }
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
    const newListOrder = [...projectLists];
    const [movedList] = newListOrder.splice(sourceIndex, 1);
    newListOrder.splice(targetIndex, 0, movedList);
    
    reorderProjectLists(project.id, newListOrder.map(list => list.id));
  };

  if (showArchive) {
    return <ProjectTasksArchive project={project} onBack={() => setShowArchive(false)} />;
  }

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to {t('nav.projects')}</span>
            </button>
            
            <div className="h-6 w-px bg-slate-300" />
            
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: project.color }}
                />
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{project.name}</h1>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{project.description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-1">
                {projectUsers.slice(0, 4).map(user => (
                  <div
                    key={user.id}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: user.color }}
                    title={user.name}
                  >
                    {user.name.charAt(0)}
                  </div>
                ))}
                {projectUsers.length > 4 && (
                  <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-400 flex items-center justify-center text-white text-sm font-medium">
                    +{projectUsers.length - 4}
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setShowArchive(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Completed Tasks</span>
            </button>
            <button
              onClick={onTVDashboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Monitor className="w-5 h-5" />
              <span>TV Dashboard</span>
            </button>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4">
          {projectLists.map((list, index) => (
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
                  projectUsers={projectUsers}
                />
              </div>
            </div>
          ))}

          <div className="w-72 flex-shrink-0">
            {!isCreatingList ? (
              <button
                onClick={() => setIsCreatingList(true)}
                className="w-full h-28 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all duration-200 flex flex-col items-center justify-center space-y-2"
              >
                <Plus className="w-6 h-6" />
                <span className="text-sm font-medium">{t('personal.createList')}</span>
              </button>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-3">
                <form onSubmit={handleCreateList} className="space-y-2">
                  <input
                    type="text"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    placeholder="List title..."
                    className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
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
                      onClick={() => {
                        setIsCreatingList(false);
                        setNewListTitle('');
                      }}
                      className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-700 p-2 text-sm rounded-lg transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {projectLists.length === 0 && !isCreatingList && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">No Lists Yet</h3>
            <p className="text-slate-500 dark:text-slate-500 mb-6">Create your first list to start organizing tasks</p>
            <button
              onClick={() => setIsCreatingList(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              {t('personal.createList')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}