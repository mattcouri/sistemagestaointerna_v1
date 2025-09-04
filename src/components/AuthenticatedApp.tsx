import React, { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Navigation } from './Navigation';
import { PersonalDashboard } from './PersonalDashboard';
import { ProjectsDashboard } from './ProjectsDashboard';
import { DevRoadmap } from './DevRoadmap';
import { profileService } from '../services/database';
import { User } from '../types';

interface AuthenticatedAppProps {
  user: SupabaseUser;
}

export function AuthenticatedApp({ user }: AuthenticatedAppProps) {
  const [currentView, setCurrentView] = useState<'personal' | 'projects' | 'roadmap'>('personal');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function setupUser() {
      try {
        // Try to get existing profile
        let dbUser;
        try {
          dbUser = await profileService.getProfile(user.id);
        } catch (error) {
          // Profile doesn't exist, create it (should be automatic via trigger)
          dbUser = await profileService.createProfile({
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            color: '#3B82F6'
          });
        }
        
        setCurrentUser(dbUser);
      } catch (error) {
        console.error('Error setting up profile:', error);
      } finally {
        setLoading(false);
      }
    }

    setupUser();
  }, [user]);

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