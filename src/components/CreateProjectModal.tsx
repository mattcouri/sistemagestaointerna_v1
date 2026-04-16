import React, { useState } from 'react';
import { X, Palette, Users, UserPlus, Search, Clock, ChevronRight, FolderPlus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { User } from '../types';

interface CreateProjectModalProps {
  onClose: () => void;
  availableUsers: any[];
}

type Step = 'details' | 'members';

export function CreateProjectModal({ onClose, availableUsers }: CreateProjectModalProps) {
  const { createProject, inviteToProject, allProfiles, currentUser, projects } = useApp();

  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [inviting, setInviting] = useState<string | null>(null);
  const [sentInvites, setSentInvites] = useState<Set<string>>(new Set());
  const [inviteError, setInviteError] = useState<string | null>(null);

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#14B8A6',
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentUser) return;
    setCreating(true);
    try {
      await createProject(name.trim(), description.trim(), [], selectedColor);
      setStep('members');
    } finally {
      setCreating(false);
    }
  };

  React.useEffect(() => {
    if (step === 'members' && !createdProjectId && currentUser) {
      const sorted = [...projects].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latest = sorted.find(p => p.name === name.trim() && p.created_by === currentUser.id);
      if (latest) setCreatedProjectId(latest.id);
    }
  }, [step, projects]);

  const nonMembers = allProfiles.filter(p =>
    p.id !== currentUser?.id &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleInvite = async (user: User) => {
    if (!createdProjectId) return;
    setInviting(user.id);
    setInviteError(null);
    try {
      await inviteToProject(createdProjectId, user.id);
      setSentInvites(prev => new Set([...prev, user.id]));
    } catch (e: any) {
      setInviteError(e.message || 'Failed to send invitation');
    } finally {
      setInviting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center space-x-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: selectedColor + '22' }}
            >
              {step === 'details'
                ? <FolderPlus className="w-5 h-5" style={{ color: selectedColor }} />
                : <Users className="w-5 h-5" style={{ color: selectedColor }} />
              }
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-white">
                {step === 'details' ? 'Create New Project' : 'Invite Members'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 'details' ? 'Step 1 of 2' : `Step 2 of 2 · ${name}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center px-5 pt-4 pb-2 space-x-2 shrink-0">
          <div className={`flex-1 h-1 rounded-full transition-colors ${step === 'details' || step === 'members' ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <div className={`flex-1 h-1 rounded-full transition-colors ${step === 'members' ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
        </div>

        {/* Step 1: Details */}
        {step === 'details' && (
          <form onSubmit={handleCreate} className="p-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
                placeholder="Enter project name"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-slate-700 dark:text-white text-sm"
                rows={3}
                placeholder="Describe the project goals and objectives"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Project Color
              </label>
              <div className="flex items-center space-x-3 mb-3">
                <Palette className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <div
                  className="w-7 h-7 rounded-lg border-2 border-slate-300 dark:border-slate-600"
                  style={{ backgroundColor: selectedColor }}
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">Selected</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      selectedColor === color
                        ? 'border-slate-800 dark:border-slate-200 scale-110'
                        : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || creating}
                className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {creating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Members */}
        {step === 'members' && (
          <>
            <div className="px-5 pt-4 pb-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users to invite..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                />
              </div>
              {inviteError && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{inviteError}</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-2">
              {sentInvites.size > 0 && (
                <div className="mb-3">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Invited ({sentInvites.size})
                  </h3>
                  <div className="space-y-1.5">
                    {allProfiles.filter(p => sentInvites.has(p.id)).map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2.5 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                            style={{ backgroundColor: user.color }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-800 dark:text-white">{user.name}</span>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                          </div>
                        </div>
                        <span className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3" />
                          <span>Invited</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  {searchQuery ? 'Results' : 'All Users'}
                </h3>
                {nonMembers.filter(p => !sentInvites.has(p.id)).length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic py-3 text-center">
                    {searchQuery ? 'No users found' : 'No other users to invite'}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {nonMembers.filter(p => !sentInvites.has(p.id)).map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                            style={{ backgroundColor: user.color }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-800 dark:text-white">{user.name}</span>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleInvite(user)}
                          disabled={inviting === user.id}
                          className="flex items-center space-x-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {inviting === user.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                          ) : (
                            <UserPlus className="w-3 h-3" />
                          )}
                          <span>Invite</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-700 shrink-0">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
