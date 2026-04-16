import React, { useState, useMemo } from 'react';
import { X, Share2, Search, Check, Users } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface ShareListModalProps {
  list: any;
  onClose: () => void;
}

export function ShareListModal({ list, onClose }: ShareListModalProps) {
  const { allProfiles, currentUser, shareList } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(list.shared_with || []));
  const [saving, setSaving] = useState(false);

  const candidates = useMemo(() =>
    allProfiles.filter(u =>
      u.id !== currentUser?.id &&
      u.name.toLowerCase().includes(search.toLowerCase())
    ),
    [allProfiles, currentUser, search]
  );

  const toggle = (userId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await shareList(list.id, Array.from(selected));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const selectedUsers = allProfiles.filter(u => selected.has(u.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-[#1e2535] rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Share List</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">Sharing <span className="text-white font-medium">{list.title}</span></p>
          </div>

          {/* Selected users chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => toggle(u.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white transition-all hover:opacity-80"
                  style={{ backgroundColor: u.color || '#3B82F6' }}
                >
                  {u.name}
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-9 pr-3 py-2.5 bg-[#2a3347] border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              autoFocus
            />
          </div>

          {/* User list */}
          <div className="max-h-52 overflow-y-auto space-y-1 -mx-1 px-1">
            {candidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <Users className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              candidates.map(u => {
                const isSelected = selected.has(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggle(u.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                      isSelected
                        ? 'bg-blue-600/20 border border-blue-500/40'
                        : 'hover:bg-slate-700/60 border border-transparent'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: u.color || '#3B82F6' }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{u.name}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected ? 'bg-blue-500 border-blue-500' : 'border border-slate-500'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : selected.size > 0 ? `Share with ${selected.size}` : 'Save (unshare)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
