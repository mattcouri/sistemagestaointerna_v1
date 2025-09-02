import React, { useState } from 'react';
import { LogIn, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginFormProps {
  onLogin: (email: string, name: string) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && name.trim()) {
      onLogin(email.trim(), name.trim());
    }
  };

  const handleQuickLogin = (userEmail: string, userName: string) => {
    onLogin(userEmail, userName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('login.title')}</h1>
          <p className="text-slate-600">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('login.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('login.emailPlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('login.name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('login.namePlaceholder')}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <LogIn className="w-5 h-5" />
            <span>{t('login.signIn')}</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-600 mb-4 text-center">{t('login.quickLogin')}</p>
          <div className="space-y-2">
            <button
              onClick={() => handleQuickLogin('sarah@example.com', 'Sarah Johnson')}
              className="w-full p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-sm"
            >
              <span className="font-medium">Sarah Johnson</span>
              <span className="text-slate-500 ml-2">sarah@example.com</span>
            </button>
            <button
              onClick={() => handleQuickLogin('mike@example.com', 'Mike Chen')}
              className="w-full p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-sm"
            >
              <span className="font-medium">Mike Chen</span>
              <span className="text-slate-500 ml-2">mike@example.com</span>
            </button>
            <button
              onClick={() => handleQuickLogin('emily@example.com', 'Emily Rodriguez')}
              className="w-full p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-sm"
            >
              <span className="font-medium">Emily Rodriguez</span>
              <span className="text-slate-500 ml-2">emily@example.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}