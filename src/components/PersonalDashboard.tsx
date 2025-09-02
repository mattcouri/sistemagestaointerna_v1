import React, { useState, useEffect } from 'react';
import { Plus, Target, Lock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ListColumn } from './ListColumn';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useListDragAndDrop } from '../hooks/useListDragAndDrop';

export function PersonalDashboard() {
  const { currentUser, createList, reorderLists, users, getUsersInProject, lastUpdate } = useApp();
  const { t } = useLanguage();
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const { draggedTask, handleDragStart, handleDragEnd, handleDragOver } = useDragAndDrop();
  const { 
    draggedList, 
    handleListDragStart, 
    handleListDragEnd, 
    handleListDragOver, 
    handleListDrop 
  } = useListDragAndDrop();

  if (!currentUser) return null;

  // Force re-render when data updates
  useEffect(() => {
    // This effect will run whenever lastUpdate changes, forcing a re-render
  }, [lastUpdate]);

  const personalLists = currentUser.lists.filter(list => list.type === 'personal');
  
  // Group project lists by project and create consolidated views
  const projectListsGrouped = currentUser.lists
    .filter(list => list.type === 'project')
    .reduce((acc, list) => {
      if (!list.projectId) return acc;
      
      if (!acc[list.projectId]) {
        // Get all tasks from all lists in this project assigned to current user
        const allProjectTasks = users
          .flatMap(user => user.lists)
          .filter(l => l.projectId === list.projectId)
          .flatMap(l => l.tasks)
          .filter(task => task.assignedTo === currentUser.id);
        
        acc[list.projectId] = {
          ...list,
          tasks: allProjectTasks
        };
      }
      return acc;
    }, {} as Record<string, List>);
  
  const consolidatedProjectLists = Object.values(projectListsGrouped);
  const allPersonalLists = [...personalLists, ...consolidatedProjectLists];

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListTitle.trim()) {
      createList(newListTitle.trim(), 'personal');
      setNewListTitle('');
      setIsCreatingList(false);
    }
  };

  const handleDrop = (e: React.DragEvent, targetListId: string) => {
    e.preventDefault();
    handleDragEnd();
    // Handle task movement logic here
  };

  const handleListReorder = (sourceIndex: number, targetIndex: number) => {
    const newListOrder = [...allPersonalLists];
    const [movedList] = newListOrder.splice(sourceIndex, 1);
    newListOrder.splice(targetIndex, 0, movedList);
    
    reorderLists(currentUser.id, newListOrder.map(list => list.id));
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{t('personal.title')}</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-300">{t('personal.subtitle')}</p>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4">
          {/* Existing Lists */}
          {allPersonalLists.map((list, index) => (
            <div
              key={list.id}
              draggable
              onDragStart={() => handleListDragStart(list.id, index)}
              onDragEnd={handleListDragEnd}
              onDragOver={handleListDragOver}
              onDrop={(e) => handleListDrop(e, index, handleListReorder)}
              className={`transition-opacity ${draggedList?.listId === list.id ? 'opacity-50' : ''}`}
            >
              <ListColumn
                list={list}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isPersonalDashboard={true}
                projectUsers={list.type === 'project' && list.projectId ? getUsersInProject(list.projectId) : undefined}
              />
            </div>
          ))}

          {/* Create New List */}
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
      </div>
    </div>
  );
}