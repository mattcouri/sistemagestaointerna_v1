import React, { useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { LoginForm } from './components/LoginForm';
import { Navigation } from './components/Navigation';
import { PersonalDashboard } from './components/PersonalDashboard';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { DevRoadmap } from './components/DevRoadmap';

function AppContent() {
  const { isAuthenticated, login } = useApp();
  const [currentView, setCurrentView] = useState<'personal' | 'projects' | 'roadmap'>('personal');
  const [showCreateProject, setShowCreateProject] = useState(false);

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  const handleCreateProject = () => {
    setShowCreateProject(true);
    setCurrentView('projects');
  };

  const handleCreateIdea = () => {
    // This will be handled by the DevRoadmap component
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navigation 
        currentView={currentView}
        onViewChange={setCurrentView}
        onCreateProject={handleCreateProject}
      />
      
      {currentView === 'personal' && <PersonalDashboard />}
      {currentView === 'projects' && <ProjectsDashboard />}
      {currentView === 'roadmap' && <DevRoadmap />}
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;