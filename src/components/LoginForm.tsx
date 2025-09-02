import React, { useState } from 'react';
import { LogIn, User, Mail, Lock } from 'lucide-react';
import { useSupabase } from '../hooks/useSupabase';
import { useLanguage } from '../contexts/LanguageContext';

export function LoginForm() {
  const { signIn, signUp } = useSupabase();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError('Name is required for sign up');
          return;
        }
        const { error } = await signUp(email.trim(), password, name.trim());
        if (error) throw error;
      } else {
        const { error } = await signIn(email.trim(), password);
        if (error) throw error;
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string = 'demo123456') => {
    setLoading(true);
    setError('');
    
    try {
      const { error } = await signIn(demoEmail, demoPassword);
      if (error) {
        // If demo user doesn't exist, create them
        const demoName = demoEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
        const { error: signUpError } = await signUp(demoEmail, demoPassword, demoName);
        if (signUpError) throw signUpError;
      }
    } catch (error: any) {
      setError(error.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (email: string, name: string) => {
    handleDemoLogin(email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Team Kanban</h1>
          <p className="text-slate-600">{isSignUp ? 'Create your account' : 'Sign in to your account'}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
                required={isSignUp}
                disabled={loading}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>{isSignUp ? 'Sign Up' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-blue-600 hover:text-blue-800 text-sm"
            disabled={loading}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-600 mb-4 text-center">Quick demo access:</p>
          <div className="space-y-2">
            <button
              onClick={() => handleDemoLogin('sarah.johnson@demo.com')}
              disabled={loading}
              className="w-full p-2 text-left bg-slate-50 hover:bg-slate-100 disabled:bg-slate-100 rounded-lg transition-colors text-sm"
            >
              <span className="font-medium">Sarah Johnson</span>
              <span className="text-slate-500 ml-2">sarah.johnson@demo.com</span>
            </button>
            <button
              onClick={() => handleDemoLogin('mike.chen@demo.com')}
              disabled={loading}
              className="w-full p-2 text-left bg-slate-50 hover:bg-slate-100 disabled:bg-slate-100 rounded-lg transition-colors text-sm"
            >
              <span className="font-medium">Mike Chen</span>
              <span className="text-slate-500 ml-2">mike.chen@demo.com</span>
            </button>
            <button
              onClick={() => handleDemoLogin('emily.rodriguez@demo.com')}
              disabled={loading}
              className="w-full p-2 text-left bg-slate-50 hover:bg-slate-100 disabled:bg-slate-100 rounded-lg transition-colors text-sm"
            >
              <span className="font-medium">Emily Rodriguez</span>
              <span className="text-slate-500 ml-2">emily.rodriguez@demo.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}