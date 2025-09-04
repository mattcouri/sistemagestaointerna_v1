import React, { useState } from 'react';
import { Navigation } from './Navigation';
import { PersonalDashboard } from './PersonalDashboard';
import { ProjectsDashboard } from './ProjectsDashboard';
import { DevRoadmap } from './DevRoadmap';
import { useApp } from '../contexts/AppContext';

interface AuthenticatedAppProps {
  user: any; // We'll get user from AppContext instead
}

export function AuthenticatedApp({ user }: AuthenticatedAppProps) {
  const [currentView, setCurrentView] = useState<'personal' | 'projects' | 'roadmap'>('personal');
  const { currentUser, loading } = useApp();

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  const handleCreateProject = () => {
    setCurrentView('projects');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navigation 
        currentView={currentView}
        onViewChange={setCurrentView}
        onCreateProject={handleCreateProject}
        currentUser={currentUser}
      />
      
      {currentView === 'personal' && <PersonalDashboard currentUser={currentUser} />}
      {currentView === 'projects' && <ProjectsDashboard currentUser={currentUser} />}
      {currentView === 'roadmap' && <DevRoadmap currentUser={currentUser} />}
    </div>
  );
}