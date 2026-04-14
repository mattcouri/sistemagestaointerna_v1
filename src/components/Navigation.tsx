import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, FolderOpen, LogOut, Sun, Moon, Lightbulb, Languages, Bell, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useApp } from '../contexts/AppContext';
import { User } from '../types';
import { InvitationsPanel } from './InvitationsPanel';

interface NavigationProps {
  currentView: 'personal' | 'projects' | 'roadmap' | 'admin';
  onViewChange: (view: 'personal' | 'projects' | 'roadmap' | 'admin') => void;
  currentUser: User;
}

export function Navigation({ currentView, onViewChange, currentUser }: NavigationProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { pendingInvitations, logout } = useApp();
  const [showInvitations, setShowInvitations] = useState(false);
  const invitationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (invitationsRef.current && !invitationsRef.current.contains(e.target as Node)) {
        setShowInvitations(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white p-4 shadow-lg border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="font-semibold text-slate-800 dark:text-white leading-tight">{currentUser.name}</h2>
                {currentUser.is_admin && (
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">Admin</span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex space-x-1">
            <button
              onClick={() => onViewChange('personal')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                currentView === 'personal'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>{t('nav.personal')}</span>
            </button>

            <button
              onClick={() => onViewChange('projects')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
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
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                currentView === 'roadmap'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              <span>{t('nav.devRoadmap')}</span>
            </button>

            {currentUser.is_admin && (
              <button
                onClick={() => onViewChange('admin')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                  currentView === 'admin'
                    ? 'bg-slate-800 dark:bg-slate-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative" ref={invitationsRef}>
            <button
              onClick={() => setShowInvitations(v => !v)}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Invitations"
            >
              <Bell className="w-5 h-5" />
              {pendingInvitations.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                  {pendingInvitations.length}
                </span>
              )}
            </button>

            {showInvitations && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Project Invitations</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <InvitationsPanel onClose={() => setShowInvitations(false)} />
                </div>
              </div>
            )}
          </div>

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
            onClick={logout}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
