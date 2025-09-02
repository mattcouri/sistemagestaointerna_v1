import React, { useEffect, useState } from 'react';
import { Monitor, RefreshCw, Calendar, Users } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { ListColumn } from './ListColumn';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { formatWeekRange, getCurrentWeek } from '../utils/dateUtils';

export function TVDashboard() {
  const { users, projects, moveTask, lastUpdate } = useApp();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { draggedTask, handleDragStart, handleDragEnd, handleDragOver } = useDragAndDrop();

  const { start, end } = getCurrentWeek();
  const weekRange = formatWeekRange(start, end);

  // Force re-render when data updates
  useEffect(() => {
    // This effect will run whenever lastUpdate changes, forcing a re-render
  }, [lastUpdate]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Force re-render to show any updates
      window.location.reload();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Full-screen mode
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const handleToggleFullscreen = async () => {
    if (!isFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (error) {
        console.warn('Could not enter fullscreen mode:', error);
      }
    } else {
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (error) {
          console.warn('Could not exit fullscreen mode:', error);
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetListId: string) => {
    e.preventDefault();
    handleDragEnd();
    
    if (!draggedTask) return;
    
    const { task, sourceListId } = draggedTask;
    
    if (sourceListId === targetListId) return;

    moveTask(task.id, sourceListId, targetListId);
  };

  // Get all lists from all users
  const allLists = users.flatMap(user => user.lists);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white ${
      isFullscreen ? 'p-8' : 'p-6'
    }`}>
      {/* Header */}
      <header className={`mb-8 ${isFullscreen ? 'mb-12' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <Monitor className={`${isFullscreen ? 'w-12 h-12' : 'w-8 h-8'} text-blue-400`} />
              <h1 className={`${isFullscreen ? 'text-6xl' : 'text-4xl'} font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent`}>
                Team Dashboard
              </h1>
            </div>
            <div className={`${isFullscreen ? 'text-3xl' : 'text-xl'} text-slate-300 flex items-center space-x-3`}>
              <Calendar className={`${isFullscreen ? 'w-8 h-8' : 'w-6 h-6'}`} />
              <span>Week of {weekRange}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`${isFullscreen ? 'px-8 py-4 text-2xl' : 'px-6 py-3 text-lg'} rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                autoRefresh 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-slate-600 hover:bg-slate-700'
              }`}
            >
              <RefreshCw className={`${isFullscreen ? 'w-8 h-8' : 'w-5 h-5'} ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>{autoRefresh ? 'Live' : 'Paused'}</span>
            </button>
            
            <button
              onClick={handleToggleFullscreen}
              className={`${isFullscreen ? 'px-8 py-4 text-2xl' : 'px-6 py-3 text-lg'} bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 flex items-center space-x-3`}
            >
              <Monitor className={`${isFullscreen ? 'w-8 h-8' : 'w-5 h-5'}`} />
              <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>

        {/* Team Overview */}
        <div className={`mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 ${isFullscreen ? 'mt-12' : ''}`}>
          {users.map(user => {
            const userTasks = user.lists.flatMap(list => list.tasks);
            const completedTasks = userTasks.filter(task => task.completed).length;
            
            return (
              <div key={user.id} className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-3 mb-2">
                  <div 
                    className={`${isFullscreen ? 'w-12 h-12 text-xl' : 'w-10 h-10 text-lg'} rounded-full flex items-center justify-center text-white font-bold`}
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className={`${isFullscreen ? 'text-2xl' : 'text-lg'} font-bold`}>{user.name}</h3>
                    <p className={`${isFullscreen ? 'text-lg' : 'text-sm'} text-slate-300`}>
                      {completedTasks}/{userTasks.length} tasks
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </header>

      {/* Kanban Board */}
      <div className={`grid gap-6 ${
        isFullscreen 
          ? allLists.length <= 4 
            ? `grid-cols-${Math.min(allLists.length, 4)}` 
            : 'grid-cols-4'
          : allLists.length <= 3
            ? `grid-cols-${allLists.length}`
            : 'grid-cols-3 xl:grid-cols-4'
      }`}>
        {allLists.map((list) => {
          const user = users.find(u => u.id === list.userId);
          return (
            <div key={list.id} className="bg-slate-800/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: user?.color }}
                  />
                  <span className={`${isFullscreen ? 'text-xl' : 'text-lg'} font-semibold text-white`}>
                    {user?.name}
                  </span>
                </div>
                <h3 className={`${isFullscreen ? 'text-2xl' : 'text-xl'} font-bold text-white mb-2`}>
                  {list.title}
                </h3>
                {list.strategy && (
                  <p className={`${isFullscreen ? 'text-lg' : 'text-sm'} text-slate-300 italic mb-4`}>
                    {list.strategy}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                {list.tasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(task, list.id)}
                    className={`p-3 bg-slate-700/50 rounded-lg cursor-move transition-all hover:bg-slate-700/70 ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500' :
                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <span className="text-xs text-slate-400 font-mono bg-slate-800/50 px-1 rounded">
                        #{task.tag}
                      </span>
                      <span className={`${isFullscreen ? 'text-lg' : 'text-sm'} text-white ${
                        task.completed ? 'line-through' : ''
                      }`}>
                        {task.title}
                      </span>
                      {task.completed && (
                        <span className="text-green-400 text-sm">✓</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {list.tasks.length === 0 && (
                  <div className={`${isFullscreen ? 'p-6 text-lg' : 'p-4 text-sm'} text-center text-slate-400 bg-slate-700/30 rounded-lg border-2 border-dashed border-slate-600`}>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <div className={`fixed ${isFullscreen ? 'bottom-8 right-8 px-8 py-4 text-2xl' : 'bottom-4 right-4 px-6 py-3 text-lg'} bg-green-600 text-white rounded-lg shadow-lg flex items-center space-x-3`}>
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <span>Live Updates</span>
        </div>
      )}
    </div>
  );
}