import React, { useState } from 'react';
import { Shield, Users, Building2, Plus, Trash2, CreditCard as Edit2, Check, X, ChevronDown, Crown, UserCheck, UserX, Search, Settings } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { User, Organization } from '../types';

type AdminTab = 'users' | 'organizations';

const COLOR_OPTIONS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316',
];

export function AdminPanel() {
  const {
    allProfiles, organizations, currentUser,
    updateProfile, setUserAdmin, assignUserToOrganization,
    createOrganization, updateOrganization, deleteOrganization,
    refreshData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingOrg, setEditingOrg] = useState<string | null>(null);
  const [newOrgName, setNewOrgName] = useState('');
  const [showNewOrgForm, setShowNewOrgForm] = useState(false);
  const [editUserForm, setEditUserForm] = useState<{ name: string; color: string; organization_id: string | null }>({
    name: '', color: '#3B82F6', organization_id: null,
  });
  const [editOrgForm, setEditOrgForm] = useState({ name: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser?.is_admin) {
    return (
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-600 dark:text-slate-400">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-500 mt-2">You need admin privileges to access this page.</p>
      </div>
    );
  }

  const filteredUsers = allProfiles.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditUser = (user: User) => {
    setEditingUser(user.id);
    setEditUserForm({
      name: user.name,
      color: user.color,
      organization_id: user.organization_id ?? null,
    });
    setError(null);
  };

  const cancelEditUser = () => {
    setEditingUser(null);
    setError(null);
  };

  const saveUser = async (userId: string) => {
    setSaving(true);
    setError(null);
    try {
      await updateProfile(userId, {
        name: editUserForm.name,
        color: editUserForm.color,
      });
      if (editUserForm.organization_id !== allProfiles.find(p => p.id === userId)?.organization_id) {
        await assignUserToOrganization(userId, editUserForm.organization_id);
      }
      setEditingUser(null);
    } catch (e: any) {
      setError(e.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const toggleAdmin = async (user: User) => {
    if (user.id === currentUser.id) return;
    setSaving(true);
    setError(null);
    try {
      await setUserAdmin(user.id, !user.is_admin);
    } catch (e: any) {
      setError(e.message || 'Failed to update admin status');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createOrganization(newOrgName.trim());
      setNewOrgName('');
      setShowNewOrgForm(false);
    } catch (e: any) {
      setError(e.message || 'Failed to create organization');
    } finally {
      setSaving(false);
    }
  };

  const startEditOrg = (org: Organization) => {
    setEditingOrg(org.id);
    setEditOrgForm({ name: org.name });
    setError(null);
  };

  const saveOrg = async (orgId: string) => {
    setSaving(true);
    setError(null);
    try {
      await updateOrganization(orgId, { name: editOrgForm.name });
      setEditingOrg(null);
    } catch (e: any) {
      setError(e.message || 'Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrg = async (orgId: string) => {
    if (!confirm('Delete this organization? Members will be unassigned.')) return;
    setSaving(true);
    setError(null);
    try {
      await deleteOrganization(orgId);
    } catch (e: any) {
      setError(e.message || 'Failed to delete organization');
    } finally {
      setSaving(false);
    }
  };

  const getOrgName = (orgId: string | null | undefined) => {
    if (!orgId) return 'No organization';
    return organizations.find(o => o.id === orgId)?.name ?? 'Unknown';
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-slate-700 dark:bg-slate-700 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Admin Panel</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Manage users, permissions, and organizations</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex space-x-1 mb-6 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'users'
                ? 'bg-slate-700 dark:bg-slate-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users ({allProfiles.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('organizations')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'organizations'
                ? 'bg-slate-700 dark:bg-slate-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Organizations ({organizations.length})</span>
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Organization</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Role</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      {editingUser === user.id ? (
                        <td colSpan={4} className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              type="text"
                              value={editUserForm.name}
                              onChange={e => setEditUserForm(f => ({ ...f, name: e.target.value }))}
                              className="flex-1 min-w-[150px] px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Name"
                            />
                            <div className="flex items-center space-x-1">
                              {COLOR_OPTIONS.map(c => (
                                <button
                                  key={c}
                                  onClick={() => setEditUserForm(f => ({ ...f, color: c }))}
                                  className={`w-6 h-6 rounded-full transition-transform ${editUserForm.color === c ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : ''}`}
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                            <select
                              value={editUserForm.organization_id ?? ''}
                              onChange={e => setEditUserForm(f => ({ ...f, organization_id: e.target.value || null }))}
                              className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">No organization</option>
                              {organizations.map(org => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                              ))}
                            </select>
                            <div className="flex items-center space-x-2 ml-auto">
                              <button
                                onClick={() => saveUser(user.id)}
                                disabled={saving}
                                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEditUser}
                                className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                                style={{ backgroundColor: user.color }}
                              >
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-slate-800 dark:text-white text-sm">{user.name}</span>
                                  {user.id === currentUser.id && (
                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">You</span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-600 dark:text-slate-300">{getOrgName(user.organization_id)}</span>
                          </td>
                          <td className="px-4 py-3">
                            {user.is_admin ? (
                              <span className="inline-flex items-center space-x-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                                <Crown className="w-3 h-3" />
                                <span>Admin</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                                <span>Member</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => startEditUser(user)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title="Edit user"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleAdmin(user)}
                                disabled={user.id === currentUser.id || saving}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  user.id === currentUser.id
                                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                    : user.is_admin
                                    ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                    : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                }`}
                                title={user.is_admin ? 'Remove admin' : 'Make admin'}
                              >
                                <Crown className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                  No users found
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'organizations' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowNewOrgForm(true)}
                className="bg-slate-700 dark:bg-slate-700 hover:bg-slate-600 dark:hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Organization</span>
              </button>
            </div>

            {showNewOrgForm && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 border-2 border-dashed border-slate-200 dark:border-slate-600">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Create Organization</h3>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newOrgName}
                    onChange={e => setNewOrgName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateOrg()}
                    placeholder="Organization name"
                    autoFocus
                    className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleCreateOrg}
                    disabled={saving || !newOrgName.trim()}
                    className="px-4 py-2 bg-slate-800 dark:bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-500 disabled:opacity-50 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setShowNewOrgForm(false); setNewOrgName(''); }}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {organizations.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-10 text-center">
                  <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No organizations yet. Create one to group your users.</p>
                </div>
              ) : (
                organizations.map(org => {
                  const members = allProfiles.filter(p => p.organization_id === org.id);
                  return (
                    <div key={org.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                        {editingOrg === org.id ? (
                          <div className="flex items-center space-x-3 flex-1">
                            <input
                              type="text"
                              value={editOrgForm.name}
                              onChange={e => setEditOrgForm({ name: e.target.value })}
                              onKeyDown={e => e.key === 'Enter' && saveOrg(org.id)}
                              autoFocus
                              className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button onClick={() => saveOrg(org.id)} disabled={saving} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingOrg(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                              </div>
                              <div>
                                <span className="font-semibold text-slate-800 dark:text-white">{org.name}</span>
                                <span className="ml-2 text-xs text-slate-400">{members.length} member{members.length !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button onClick={() => startEditOrg(org)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteOrg(org.id)} disabled={saving} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {members.length > 0 ? (
                        <div className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {members.map(member => (
                              <div key={member.id} className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-700/50 rounded-full px-3 py-1">
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                                  style={{ backgroundColor: member.color }}
                                >
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm text-slate-700 dark:text-slate-300">{member.name}</span>
                                {member.is_admin && <Crown className="w-3 h-3 text-amber-500" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500 italic">
                          No members assigned yet
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
