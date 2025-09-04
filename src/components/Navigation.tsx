import React from 'react';
import { User as UserIcon, FolderOpen, Monitor, LogOut, Plus, Sun, Moon, Lightbulb, Languages } from 'lucide-react';
import { useSupabase } from '../hooks/useSupabase';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { User } from '../types';

interface NavigationProps {
  currentView: 'personal' | 'projects' | 'roadmap';
  onViewChange: (view: 'personal' | 'projects' | 'roadmap') => void;
  onCreateProject: () => void;
  currentUser: User;
}

export function Navigation({ currentView, onViewChange, onCreateProject, currentUser }: NavigationProps) {
  const { signOut } = useSupabase();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white p-4 shadow-lg border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: currentUser.color }}
            >
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-white">{currentUser.name}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex space-x-1">
            <button
              onClick={() => onViewChange('personal')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                currentView === 'personal' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{t('nav.personal')}</span>
            </button>
            
            <button
              onClick={() => onViewChange('projects')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                currentView === 'projects' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>{t('nav.projects')}</span>
            </button>
            
            <button
              onClick={() => onViewChange('roadmap')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                currentView === 'roadmap' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              <span>{t('nav.devRoadmap')}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {(currentView === 'projects' || currentView === 'roadmap') && (
            <button
              onClick={currentView === 'projects' ? onCreateProject : () => {}}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{currentView === 'projects' ? t('nav.newProject') : t('nav.newIdea')}</span>
            </button>
          )}
          
          <button
            onClick={toggleLanguage}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-1 bg-slate-100 dark:bg-slate-700/50"
            title={language === 'en' ? 'Switch to Portuguese' : 'Switch to English'}
          >
            <Languages className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-bold text-blue-400">{language === 'en' ? 'EN' : 'PT'}</span>
          </button>
          
          <button
            onClick={toggleDarkMode}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button
            onClick={handleLogout}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}