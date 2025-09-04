import React, { useEffect, useState, useRef } from 'react';
import { Monitor, RefreshCw, Calendar, Maximize, Minimize, ZoomIn, ZoomOut, Move, RotateCcw, ArrowLeft } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface ProjectTVDashboardProps {
  project: any; // Using any since Project type may have mismatches
  onBack: () => void;
}

interface ViewSettings {
  zoom: number;
  panX: number;
  panY: number;
}

export function ProjectTVDashboard({ project, onBack }: ProjectTVDashboardProps) {
  const { getProjectLists, getUsersInProject } = useApp();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Load saved view settings or use defaults
  const [viewSettings, setViewSettings] = useState<ViewSettings>(() => {
    const saved = localStorage.getItem(`tv-dashboard-${project.id}`);
    return saved ? JSON.parse(saved) : { zoom: 1, panX: 0, panY: 0 };
  });

  const today = new Date();
  const weekNumber = Math.ceil(((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);

  const projectLists = getProjectLists(project.id);
  const projectUsers = getUsersInProject(project.id);

  // Save view settings whenever they change
  useEffect(() => {
    localStorage.setItem(`tv-dashboard-${project.id}`, JSON.stringify(viewSettings));
  }, [viewSettings, project.id]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Just trigger a re-render instead of full page reload
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

  const handleZoomIn = () => {
    setViewSettings(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom + 0.1, 2)
    }));
  };

  const handleZoomOut = () => {
    setViewSettings(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom - 0.1, 0.5)
    }));
  };

  const handleResetView = () => {
    setViewSettings({ zoom: 1, panX: 0, panY: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewSettings.panX, y: e.clientY - viewSettings.panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setViewSettings(prev => ({
      ...prev,
      panX: e.clientX - dragStart.x,
      panY: e.clientY - dragStart.y
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Calculate if content should be centered (when lists don't fill the screen)
  const totalListWidth = projectLists.length * 320 + (projectLists.length - 1) * 16; // 320px per list + 16px gap
  const shouldCenter = totalListWidth < window.innerWidth;

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      <header className="p-4 pb-2">
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-white hover:text-slate-300 transition-colors bg-slate-800/50 hover:bg-slate-700/50 px-3 py-2 rounded-lg backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          {/* Centered Project Info */}
          <div className="flex items-center space-x-3 absolute left-1/2 transform -translate-x-1/2">
            <div 
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: project.color }}
            >
              <Monitor className="w-3 h-3 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white mb-1">
                {project.name}
              </h1>
              <p className="text-sm text-slate-300">{project.description}</p>
            </div>
          </div>
          
          {/* Date Info */}
          <div className="text-right">
            <div className="text-lg font-semibold text-white">
              {today.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-sm text-slate-300">
              Week {weekNumber}
            </div>
          </div>
        </div>
      </header>

      {/* Kanban Board Container */}
      <div 
        ref={containerRef}
        className="relative h-[calc(100vh-120px)] overflow-hidden"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
      >
        <div 
          className={`flex gap-4 pb-20 px-4 transition-transform duration-200 ${
            shouldCenter ? 'justify-center' : ''
          }`}
          style={{
            transform: `scale(${viewSettings.zoom}) translate(${viewSettings.panX}px, ${viewSettings.panY}px)`,
            transformOrigin: 'top left',
            minWidth: shouldCenter ? 'auto' : `${totalListWidth}px`
          }}
        >
          {projectLists.map((list) => (
            <div key={list.id} className="w-80 flex-shrink-0 bg-slate-800/60 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
              <div className="mb-3">
                <h3 className="text-lg font-bold text-white mb-2">
                  {list.title}
                </h3>
                {list.strategy && (
                  <p className="text-xs text-slate-300 italic mb-3 bg-slate-700/40 p-2 rounded border border-slate-600/30">
                    {list.strategy}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                {(list.tasks || []).map(task => (
                  <div
                    key={task.id}
                    className={`p-2.5 bg-slate-700/70 rounded-lg border border-slate-600/40 ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          task.priority === 'high' ? 'bg-red-500' :
                          task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className={`text-sm text-white font-medium ${
                          task.completed ? 'line-through' : ''
                        }`}>
                          {task.title}
                        </span>
                        {task.completed && (
                          <span className="text-green-400 text-sm flex-shrink-0">✓</span>
                        )}
                      </div>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center space-x-1 text-xs text-slate-300 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{task.dueDate.toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ))}
                
                {(list.tasks || []).length === 0 && (
                  <div className="p-4 text-sm text-center text-slate-400 bg-slate-700/40 rounded-lg border-2 border-dashed border-slate-600">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
        {/* Zoom Controls */}
        <div className="flex items-center space-x-1 bg-slate-800/80 rounded-lg p-1 backdrop-blur-sm">
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="px-2 text-xs text-white font-mono">
            {Math.round(viewSettings.zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        {/* Pan/Reset Controls */}
        <div className="flex items-center space-x-1 bg-slate-800/80 rounded-lg p-1 backdrop-blur-sm">
          <button
            onClick={handleResetView}
            className="p-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded transition-colors flex items-center space-x-1"
            title="Reset View"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <div className="flex items-center space-x-1 px-2 text-xs text-slate-300">
            <Move className="w-3 h-3" />
            <span>Drag to pan</span>
          </div>
        </div>

        {/* Auto-refresh Control */}
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`px-2 py-1.5 text-xs rounded-lg transition-all duration-200 flex items-center space-x-1 ${
            autoRefresh 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-slate-600 hover:bg-slate-700'
          }`}
        >
          <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`} />
          <span>{autoRefresh ? 'Live' : 'Paused'}</span>
        </button>
        
        {/* Fullscreen Control */}
        <button
          onClick={handleToggleFullscreen}
          className="px-2 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 flex items-center space-x-1"
        >
          {isFullscreen ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
          <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>
        
        {/* Live Indicator */}
        {autoRefresh && (
          <div className="bg-green-600 text-white px-2 py-1 rounded-lg shadow-lg flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs">Live</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectTVDashboard;