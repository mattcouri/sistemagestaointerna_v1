import React, { useState } from 'react';
import { FolderOpen, Users, Calendar, Plus, Settings, CheckCheck, Clock, Target, UserPlus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CreateProjectModal } from './CreateProjectModal';
import { EditProjectModal } from './EditProjectModal';
import { ProjectView } from './ProjectView';
import { ProjectTVDashboard } from './ProjectTVDashboard';
import { ProjectMembersModal } from './ProjectMembersModal';

export function ProjectsDashboard() {
  const { projects, currentUser, lists, allProfiles } = useApp();
  const { t } = useLanguage();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showTVDashboard, setShowTVDashboard] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [managingMembersProject, setManagingMembersProject] = useState<string | null>(null);

  if (!currentUser) return null;

  // Get projects user created (for now, we'll show user's own projects)
  const userProjects = projects || [];

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

  // Calculate KPIs from lists and tasks
  const projectLists = lists.filter(list => list.type === 'project');
  const allTasks = projectLists.flatMap(list => list.tasks || []);
  
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(task => task.completed).length;
  const highPriorityTasks = allTasks.filter(task => task.priority === 'high' && !task.completed).length;

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/60 rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">{t('projects.activeProjects')}</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-white">{userProjects.length}</p>
            </div>
            <FolderOpen className="w-8 h-8 text-blue-300 dark:text-blue-400" />
          </div>

          <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-500/60 rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">{t('projects.completedTasks')}</p>
              <p className="text-3xl font-bold text-green-900 dark:text-white">{completedTasks}</p>
            </div>
            <CheckCheck className="w-8 h-8 text-green-300 dark:text-green-400" />
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/60 rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">{t('projects.pendingTasks')}</p>
              <p className="text-3xl font-bold text-amber-900 dark:text-white">{totalTasks - completedTasks}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-300 dark:text-amber-400" />
          </div>

          <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-500/60 rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">{t('projects.highPriority')}</p>
              <p className="text-3xl font-bold text-orange-900 dark:text-white">{highPriorityTasks}</p>
            </div>
            <Target className="w-8 h-8 text-orange-300 dark:text-orange-400" />
          </div>
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
            {userProjects.map(project => (
              <div
                key={project.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer relative group"
              >
                <div 
                  className="h-2 rounded-t-lg"
                  style={{ backgroundColor: project.color }}
                />
                <div className="p-6" onClick={() => setSelectedProject(project.id)}>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setManagingMembersProject(project.id);
                      }}
                      className="w-8 h-8 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
                      title="Manage members"
                    >
                      <UserPlus className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
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
                      <span>1 member</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(project.created_at || '').toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
            availableUsers={allProfiles}
          />
        )}

        {editingProjectData && (
          <EditProjectModal
            project={editingProjectData}
            onClose={() => setEditingProject(null)}
            availableUsers={allProfiles}
          />
        )}

        {managingMembersProject && (() => {
          const proj = projects.find(p => p.id === managingMembersProject);
          return proj ? (
            <ProjectMembersModal
              project={proj}
              onClose={() => setManagingMembersProject(null)}
            />
          ) : null;
        })()}
      </div>
    </div>
  );
}