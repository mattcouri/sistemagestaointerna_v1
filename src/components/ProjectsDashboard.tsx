import React, { useState, useEffect } from 'react';
import { FolderOpen, Users, Calendar, Plus, Settings, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CreateProjectModal } from './CreateProjectModal';
import { EditProjectModal } from './EditProjectModal';
import { ProjectView } from './ProjectView';
import { ProjectTVDashboard } from './ProjectTVDashboard';

export function ProjectsDashboard() {
  const { projects, users, currentUser, lastUpdate } = useApp();
  const { t } = useLanguage();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showTVDashboard, setShowTVDashboard] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);

  if (!currentUser) return null;

  // Force re-render when data updates
  useEffect(() => {
    // This effect will run whenever lastUpdate changes, forcing a re-render
  }, [lastUpdate]);

  const userProjects = projects.filter(project => 
    project.assignedUsers.includes(currentUser.id)
  );

  const editingProjectData = editingProject ? projects.find(p => p.id === editingProject) : null;

  const currentProject = selectedProject ? projects.find(p => p.id === selectedProject) : null;

  // Show TV Dashboard for selected project
  if (showTVDashboard && currentProject) {
    return (
      <ProjectTVDashboard 
        project={currentProject}
        onBack={() => setShowTVDashboard(false)}
      />
    );
  }

  // Show individual project view
  if (selectedProject && currentProject) {
    return (
      <ProjectView 
        project={currentProject}
        onBack={() => setSelectedProject(null)}
        onTVDashboard={() => setShowTVDashboard(true)}
      />
    );
  }

  // Calculate KPIs
  const totalTasks = users.reduce((total, user) => {
    return total + user.lists.reduce((userTotal, list) => {
      if (list.type === 'project') {
        return userTotal + list.tasks.length;
      }
      return userTotal;
    }, 0);
  }, 0);

  const completedTasks = users.reduce((total, user) => {
    return total + user.lists.reduce((userTotal, list) => {
      if (list.type === 'project') {
        return userTotal + list.tasks.filter(task => task.completed).length;
      }
      return userTotal;
    }, 0);
  }, 0);

  const highPriorityTasks = users.reduce((total, user) => {
    return total + user.lists.reduce((userTotal, list) => {
      if (list.type === 'project') {
        return userTotal + list.tasks.filter(task => task.priority === 'high' && !task.completed).length;
      }
      return userTotal;
    }, 0);
  }, 0);

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <FolderOpen className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{t('projects.title')}</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300">{t('projects.subtitle')}</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>{t('projects.newProject')}</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{userProjects.length}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t('projects.activeProjects')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{completedTasks}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t('projects.completedTasks')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalTasks - completedTasks}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t('projects.pendingTasks')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{highPriorityTasks}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t('projects.highPriority')}</p>
              </div>
            </div>
          </div>

          {/* User Performance KPIs */}
          {users.slice(0, 2).map(user => {
            const userTasks = user.lists.flatMap(list => 
              list.type === 'project' ? list.tasks : []
            );
            const userCompletedTasks = userTasks.filter(task => task.completed).length;
            const completionRate = userTasks.length > 0 ? Math.round((userCompletedTasks / userTasks.length) * 100) : 0;
            
            return (
              <div key={user.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: user.color }}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{completionRate}%</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{user.name}</p>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                      <div 
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${completionRate}%`,
                          backgroundColor: user.color 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {users.map(user => {
            const userProjectTasks = user.lists.flatMap(list => 
              list.type === 'project' ? list.tasks : []
            );
            const highPriorityUserTasks = userProjectTasks.filter(task => 
              task.priority === 'high' && !task.completed
            ).length;
            const avgTasksPerProject = userProjects.length > 0 ? 
              Math.round(userProjectTasks.length / userProjects.length) : 0;

            return (
              <div key={user.id} className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">{user.name}</h3>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{userProjectTasks.length}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Total Tasks</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{highPriorityUserTasks}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">High Priority</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{avgTasksPerProject}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Avg/Project</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {userProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">{t('projects.noProjects')}</h3>
            <p className="text-slate-500 dark:text-slate-500 mb-6">{t('projects.noProjectsDesc')}</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              {t('projects.createProject')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProjects.map(project => {
              const assignedUsers = users.filter(user => 
                project.assignedUsers.includes(user.id)
              );
              
              return (
                <div
                  key={project.id}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer relative group"
                >
                  <div 
                    className="h-2 rounded-t-lg"
                    style={{ backgroundColor: project.color }}
                  />
                  <div className="p-6" onClick={() => setSelectedProject(project.id)}>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(project.id);
                        }}
                        className="w-8 h-8 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
                        title="Edit project"
                      >
                        <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </button>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                      {project.name}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>{assignedUsers.length} {t('projects.members')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{project.createdAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex -space-x-2">
                      {assignedUsers.slice(0, 4).map(user => (
                        <div
                          key={user.id}
                          className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: user.color }}
                          title={user.name}
                        >
                          {user.name.charAt(0)}
                        </div>
                      ))}
                      {assignedUsers.length > 4 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-400 flex items-center justify-center text-white text-sm font-medium">
                          +{assignedUsers.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
            availableUsers={users.filter(u => u.id !== currentUser.id)}
          />
        )}

        {editingProjectData && (
          <EditProjectModal
            project={editingProjectData}
            onClose={() => setEditingProject(null)}
            availableUsers={users}
          />
        )}
      </div>
    </div>
  );
}