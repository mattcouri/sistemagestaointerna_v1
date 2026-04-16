import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, UserMinus, Search, Send, Crown, Clock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { User, Project } from '../types';

interface ProjectMembersModalProps {
  project: Project;
  onClose: () => void;
}

export function ProjectMembersModal({ project, onClose }: ProjectMembersModalProps) {
  const { allProfiles, currentUser, inviteToProject, removeFromProject, getProjectMembers } = useApp();
  const [members, setMembers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviting, setInviting] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sentInvites, setSentInvites] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const m = await getProjectMembers(project.id);
        setMembers(m);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [project.id]);

  const memberIds = new Set(members.map(m => m.id));

  const nonMembers = allProfiles.filter(p =>
    !memberIds.has(p.id) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = async (user: User) => {
    setInviting(user.id);
    setError(null);
    try {
      await inviteToProject(project.id, user.id);
      setSentInvites(prev => new Set([...prev, user.id]));
    } catch (e: any) {
      setError(e.message || 'Failed to send invitation');
    } finally {
      setInviting(null);
    }
  };

  const handleRemove = async (user: User) => {
    if (user.id === currentUser?.id) return;
    if (!confirm(`Remove ${user.name} from this project?`)) return;
    setRemoving(user.id);
    setError(null);
    try {
      await removeFromProject(project.id, user.id);
      setMembers(prev => prev.filter(m => m.id !== user.id));
    } catch (e: any) {
      setError(e.message || 'Failed to remove member');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: project.color + '20' }}>
              <Users className="w-4 h-4" style={{ color: project.color }} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-white">Project Members</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{project.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Current Members */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Current Members ({members.length})
            </h3>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : filteredMembers.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic py-2">No members found</p>
            ) : (
              <div className="space-y-2">
                {filteredMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm font-medium text-slate-800 dark:text-white">{member.name}</span>
                          {member.id === project.created_by && (
                            <Crown className="w-3 h-3 text-amber-500" title="Project owner" />
                          )}
                          {member.id === currentUser?.id && (
                            <span className="text-xs text-blue-500">(you)</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{member.email}</span>
                      </div>
                    </div>
                    {member.id !== project.created_by && member.id !== currentUser?.id && (
                      <button
                        onClick={() => handleRemove(member)}
                        disabled={removing === member.id}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove from project"
                      >
                        {removing === member.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                        ) : (
                          <UserMinus className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invite Users */}
          {nonMembers.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Invite Users
              </h3>
              <div className="space-y-2">
                {nonMembers.map(user => (
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
                    {sentInvites.has(user.id) ? (
                      <span className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
                        <Clock className="w-3 h-3" />
                        <span>Invited</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInvite(user)}
                        disabled={inviting === user.id}
                        className="flex items-center space-x-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {inviting === user.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ) : (
                          <UserPlus className="w-3 h-3" />
                        )}
                        <span>Invite</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
