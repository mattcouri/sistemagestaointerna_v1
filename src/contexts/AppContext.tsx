import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { generateUniqueTag } from '../utils/taskUtils';
import { User, Project, List, Task, RoadmapIdea, Organization, ProjectInvitation } from '../types';

const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#EC4899', '#06B6D4', '#84CC16'
];

interface AppContextType {
  currentUser: User | null;
  projects: Project[];
  lists: List[];
  roadmapIdeas: RoadmapIdea[];
  allProfiles: User[];
  organizations: Organization[];
  pendingInvitations: ProjectInvitation[];
  loading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  continueAsGuest: () => void;

  createProject: (name: string, description: string, assignedUserIds: string[], color?: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectLists: (projectId: string) => List[];
  getUsersInProject: (projectId: string) => User[];
  getProjectMembers: (projectId: string) => Promise<User[]>;

  createList: (title: string, type: 'personal' | 'project', projectId?: string) => Promise<void>;
  updateList: (id: string, updates: Partial<List>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  reorderLists: (userId: string, listIds: string[]) => Promise<void>;
  reorderProjectLists: (projectId: string, listIds: string[]) => Promise<void>;

  addTaskToList: (listId: string, taskData: any) => Promise<void>;
  updateTask: (listId: string, taskId: string, updates: any) => Promise<void>;
  deleteTask: (listId: string, taskId: string) => Promise<void>;
  moveTask: (taskId: string, sourceListId: string, targetListId: string) => Promise<void>;

  addRoadmapIdea: (ideaData: any) => Promise<void>;
  updateRoadmapIdea: (id: string, updates: any) => Promise<void>;
  deleteRoadmapIdea: (id: string) => Promise<void>;

  inviteToProject: (projectId: string, userId: string) => Promise<void>;
  removeFromProject: (projectId: string, userId: string) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;

  createOrganization: (name: string) => Promise<Organization>;
  updateOrganization: (id: string, updates: Partial<Organization>) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  assignUserToOrganization: (userId: string, organizationId: string | null) => Promise<void>;

  updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  setUserAdmin: (userId: string, isAdmin: boolean) => Promise<void>;

  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const GUEST_USER: User = {
  id: 'guest',
  name: 'Guest User',
  email: 'guest@demo.local',
  color: '#10B981',
};

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function now() {
  return new Date().toISOString();
}

function storageKey(userId: string, key: string) {
  return `kanban_${userId}_${key}`;
}

function loadFromStorage<T>(userId: string, key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey(userId, key));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(userId: string, key: string, value: T) {
  try {
    localStorage.setItem(storageKey(userId, key), JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useSupabase();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [roadmapIdeas, setRoadmapIdeas] = useState<RoadmapIdea[]>([]);
  const [allProfiles, setAllProfiles] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<ProjectInvitation[]>([]);
  const [isGuest, setIsGuest] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const loadSupabaseData = useCallback(async (userId: string) => {
    setDataLoading(true);
    try {
      const [profileRes, projectsRes, listsRes, roadmapRes, orgsRes, invitationsRes, allProfilesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('projects').select('*, project_members!inner(user_id)').eq('project_members.user_id', userId),
        supabase.from('lists').select('*, tasks(*)').or(`user_id.eq.${userId},project_id.in.(${await getProjectIds(userId)})`).order('position'),
        supabase.from('roadmap_ideas').select('*').order('created_at', { ascending: false }),
        supabase.from('organizations').select('*').order('name'),
        supabase.from('project_invitations').select('*, project:projects(*), inviter:profiles!project_invitations_invited_by_fkey(*)').eq('invited_user_id', userId).eq('status', 'pending'),
        supabase.from('profiles').select('*').order('name'),
      ]);

      if (profileRes.data) {
        setCurrentUser(profileRes.data as User);
      }

      if (projectsRes.data) {
        setProjects(projectsRes.data as Project[]);
      }

      if (listsRes.data) {
        const mappedLists: List[] = listsRes.data.map((l: any) => ({
          ...l,
          tasks: (l.tasks || []).map((t: any) => ({
            ...t,
            dueDate: t.due_date ? new Date(t.due_date) : undefined,
          })),
        }));
        setLists(mappedLists);
      }

      if (roadmapRes.data) {
        setRoadmapIdeas(roadmapRes.data as RoadmapIdea[]);
      }

      if (orgsRes.data) {
        setOrganizations(orgsRes.data as Organization[]);
      }

      if (invitationsRes.data) {
        setPendingInvitations(invitationsRes.data as ProjectInvitation[]);
      }

      if (allProfilesRes.data) {
        setAllProfiles(allProfilesRes.data as User[]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  async function getProjectIds(userId: string): Promise<string> {
    const { data } = await supabase.from('project_members').select('project_id').eq('user_id', userId);
    if (!data || data.length === 0) return "'00000000-0000-0000-0000-000000000000'";
    return data.map(d => `'${d.project_id}'`).join(',');
  }

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      setIsGuest(false);
      loadSupabaseData(user.id);
    } else if (!isGuest) {
      setCurrentUser(null);
      setProjects([]);
      setLists([]);
      setRoadmapIdeas([]);
      setAllProfiles([]);
      setOrganizations([]);
      setPendingInvitations([]);
    }
  }, [user, authLoading, loadSupabaseData]);

  const refreshData = async () => {
    if (user) await loadSupabaseData(user.id);
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setCurrentUser(GUEST_USER);
    setProjects(loadFromStorage('guest', 'projects', []));
    setLists(loadFromStorage<List[]>('guest', 'lists', []).map(l => ({
      ...l,
      tasks: (l.tasks || []).map(t => ({
        ...t,
        dueDate: t.due_date ? new Date(t.due_date) : undefined,
      })),
    })));
    setRoadmapIdeas(loadFromStorage('guest', 'roadmap_ideas', []));
    setAllProfiles([GUEST_USER]);
  };

  const persist = (key: string, value: any) => {
    if (isGuest) saveToStorage('guest', key, value);
  };

  // ─── Projects ────────────────────────────────────────────────────────────────

  const createProject = async (name: string, description: string, assignedUserIds: string[], color?: string) => {
    if (!currentUser) return;

    if (isGuest) {
      const newProject: Project = {
        id: makeId(), name, description,
        color: color || PRESET_COLORS[projects.length % PRESET_COLORS.length],
        created_by: currentUser.id, created_at: now(), updated_at: now(),
      };
      const updated = [newProject, ...projects];
      setProjects(updated);
      persist('projects', updated);
      return;
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({ name, description, color: color || PRESET_COLORS[projects.length % PRESET_COLORS.length], created_by: currentUser.id })
      .select()
      .single();

    if (error) throw error;

    const memberIds = Array.from(new Set([currentUser.id, ...assignedUserIds]));
    await supabase.from('project_members').insert(memberIds.map(uid => ({ project_id: project.id, user_id: uid })));

    await refreshData();
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (isGuest) {
      const updated = projects.map(p => p.id === id ? { ...p, ...updates, updated_at: now() } : p);
      setProjects(updated);
      persist('projects', updated);
      return;
    }
    const { error } = await supabase.from('projects').update(updates).eq('id', id);
    if (error) throw error;
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates, updated_at: now() } : p));
  };

  const deleteProject = async (id: string) => {
    if (isGuest) {
      const updatedProjects = projects.filter(p => p.id !== id);
      const updatedLists = lists.filter(l => l.project_id !== id);
      setProjects(updatedProjects);
      setLists(updatedLists);
      persist('projects', updatedProjects);
      persist('lists', updatedLists);
      return;
    }
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    setProjects(prev => prev.filter(p => p.id !== id));
    setLists(prev => prev.filter(l => l.project_id !== id));
  };

  const getProjectLists = (projectId: string): List[] =>
    lists.filter(list => list.project_id === projectId);

  const getUsersInProject = (projectId: string): User[] => allProfiles;

  const getProjectMembers = async (projectId: string): Promise<User[]> => {
    const { data, error } = await supabase
      .from('project_members')
      .select('user_id, profiles(*)')
      .eq('project_id', projectId);
    if (error) throw error;
    return (data || []).map((d: any) => d.profiles).filter(Boolean) as User[];
  };

  // ─── Invitations ─────────────────────────────────────────────────────────────

  const inviteToProject = async (projectId: string, userId: string) => {
    if (!currentUser || isGuest) return;
    const { error } = await supabase.from('project_invitations').upsert({
      project_id: projectId,
      invited_by: currentUser.id,
      invited_user_id: userId,
      status: 'pending',
    }, { onConflict: 'project_id,invited_user_id' });
    if (error) throw error;
  };

  const removeFromProject = async (projectId: string, userId: string) => {
    if (!currentUser || isGuest) return;
    const { error } = await supabase.from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);
    if (error) throw error;
    await refreshData();
  };

  const acceptInvitation = async (invitationId: string) => {
    if (!currentUser || isGuest) return;
    const invitation = pendingInvitations.find(i => i.id === invitationId);
    if (!invitation) return;

    await supabase.from('project_invitations').update({ status: 'accepted' }).eq('id', invitationId);
    await supabase.from('project_members').upsert({
      project_id: invitation.project_id,
      user_id: currentUser.id,
    }, { onConflict: 'project_id,user_id' });

    setPendingInvitations(prev => prev.filter(i => i.id !== invitationId));
    await refreshData();
  };

  const declineInvitation = async (invitationId: string) => {
    if (!currentUser || isGuest) return;
    await supabase.from('project_invitations').update({ status: 'declined' }).eq('id', invitationId);
    setPendingInvitations(prev => prev.filter(i => i.id !== invitationId));
  };

  // ─── Lists ───────────────────────────────────────────────────────────────────

  const createList = async (title: string, type: 'personal' | 'project', projectId?: string) => {
    if (!currentUser) return;

    if (isGuest) {
      const newList: List = {
        id: makeId(), title, strategy: '', type,
        project_id: projectId, user_id: currentUser.id,
        color: undefined, position: lists.length,
        created_at: now(), updated_at: now(), tasks: [],
      };
      const updated = [...lists, newList];
      setLists(updated);
      persist('lists', updated);
      return;
    }

    const projectListCount = projectId ? lists.filter(l => l.project_id === projectId).length : 0;
    const userListCount = lists.filter(l => l.user_id === currentUser.id && !l.project_id).length;
    const position = projectId ? projectListCount : userListCount;

    const { data, error } = await supabase
      .from('lists')
      .insert({ title, strategy: '', type, project_id: projectId || null, user_id: currentUser.id, position })
      .select()
      .single();

    if (error) throw error;
    setLists(prev => [...prev, { ...data, tasks: [] }]);
  };

  const updateList = async (id: string, updates: Partial<List>) => {
    if (isGuest) {
      const updated = lists.map(l => l.id === id ? { ...l, ...updates, updated_at: now() } : l);
      setLists(updated);
      persist('lists', updated);
      return;
    }
    const { strategy, title, color } = updates;
    const dbUpdates: any = {};
    if (strategy !== undefined) dbUpdates.strategy = strategy;
    if (title !== undefined) dbUpdates.title = title;
    if (color !== undefined) dbUpdates.color = color;
    const { error } = await supabase.from('lists').update(dbUpdates).eq('id', id);
    if (error) throw error;
    setLists(prev => prev.map(l => l.id === id ? { ...l, ...updates, updated_at: now() } : l));
  };

  const deleteList = async (id: string) => {
    if (isGuest) {
      const updated = lists.filter(l => l.id !== id);
      setLists(updated);
      persist('lists', updated);
      return;
    }
    const { error } = await supabase.from('lists').delete().eq('id', id);
    if (error) throw error;
    setLists(prev => prev.filter(l => l.id !== id));
  };

  const reorderLists = async (_userId: string, listIds: string[]) => {
    const map = new Map(listIds.map((id, idx) => [id, idx]));
    setLists(prev => [...prev].sort((a, b) => (map.get(a.id) ?? a.position) - (map.get(b.id) ?? b.position)));
    if (!isGuest) {
      await Promise.all(listIds.map((id, position) =>
        supabase.from('lists').update({ position }).eq('id', id)
      ));
    }
  };

  const reorderProjectLists = async (_projectId: string, listIds: string[]) => {
    const map = new Map(listIds.map((id, idx) => [id, idx]));
    setLists(prev => [...prev].sort((a, b) => (map.get(a.id) ?? a.position) - (map.get(b.id) ?? b.position)));
    if (!isGuest) {
      await Promise.all(listIds.map((id, position) =>
        supabase.from('lists').update({ position }).eq('id', id)
      ));
    }
  };

  // ─── Tasks ───────────────────────────────────────────────────────────────────

  const addTaskToList = async (listId: string, taskData: any) => {
    const tag = generateUniqueTag();
    const list = lists.find(l => l.id === listId);
    const position = list ? list.tasks.length : 0;

    if (isGuest) {
      const newTask: Task = {
        id: makeId(), tag, title: taskData.title,
        description: taskData.description || undefined,
        priority: taskData.priority || 'medium', completed: false,
        list_id: listId, assigned_to: taskData.assigned_to || undefined,
        due_date: taskData.due_date || undefined, position,
        created_at: now(), updated_at: now(),
        dueDate: taskData.due_date ? new Date(taskData.due_date) : undefined,
      };
      const updated = lists.map(l => l.id === listId ? { ...l, tasks: [...l.tasks, newTask] } : l);
      setLists(updated);
      persist('lists', updated);
      return;
    }

    const { data, error } = await supabase.from('tasks').insert({
      tag, title: taskData.title, description: taskData.description || null,
      priority: taskData.priority || 'medium', completed: false,
      list_id: listId, assigned_to: taskData.assigned_to || null,
      due_date: taskData.due_date || null, position,
    }).select().single();

    if (error) throw error;
    const newTask: Task = { ...data, dueDate: data.due_date ? new Date(data.due_date) : undefined };
    setLists(prev => prev.map(l => l.id === listId ? { ...l, tasks: [...l.tasks, newTask] } : l));
  };

  const updateTask = async (listId: string, taskId: string, updates: any) => {
    if (isGuest) {
      const updated = lists.map(l =>
        l.id === listId ? {
          ...l,
          tasks: l.tasks.map(t => t.id === taskId
            ? { ...t, ...updates, dueDate: updates.due_date ? new Date(updates.due_date) : t.dueDate, updated_at: now() }
            : t
          ),
        } : l
      );
      setLists(updated);
      persist('lists', updated);
      return;
    }

    const dbUpdates: any = { ...updates };
    delete dbUpdates.dueDate;
    const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', taskId);
    if (error) throw error;
    setLists(prev => prev.map(l =>
      l.id === listId ? {
        ...l,
        tasks: l.tasks.map(t => t.id === taskId
          ? { ...t, ...updates, dueDate: updates.due_date ? new Date(updates.due_date) : t.dueDate, updated_at: now() }
          : t
        ),
      } : l
    ));
  };

  const deleteTask = async (listId: string, taskId: string) => {
    if (isGuest) {
      const updated = lists.map(l => l.id === listId ? { ...l, tasks: l.tasks.filter(t => t.id !== taskId) } : l);
      setLists(updated);
      persist('lists', updated);
      return;
    }
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
    setLists(prev => prev.map(l => l.id === listId ? { ...l, tasks: l.tasks.filter(t => t.id !== taskId) } : l));
  };

  const moveTask = async (taskId: string, sourceListId: string, targetListId: string) => {
    const task = lists.find(l => l.id === sourceListId)?.tasks.find(t => t.id === taskId);
    if (!task) return;
    setLists(prev => prev.map(l => {
      if (l.id === sourceListId) return { ...l, tasks: l.tasks.filter(t => t.id !== taskId) };
      if (l.id === targetListId) return { ...l, tasks: [...l.tasks, { ...task, list_id: targetListId }] };
      return l;
    }));
    if (!isGuest) {
      await supabase.from('tasks').update({ list_id: targetListId }).eq('id', taskId);
    }
  };

  // ─── Roadmap ─────────────────────────────────────────────────────────────────

  const addRoadmapIdea = async (ideaData: any) => {
    if (!currentUser) return;
    if (isGuest) {
      const newIdea: RoadmapIdea = {
        id: makeId(), title: ideaData.title, description: ideaData.description,
        category: ideaData.category, image_url: ideaData.image_url || undefined,
        created_by: currentUser.id, created_at: now(), updated_at: now(),
      };
      const updated = [newIdea, ...roadmapIdeas];
      setRoadmapIdeas(updated);
      persist('roadmap_ideas', updated);
      return;
    }
    const { data, error } = await supabase.from('roadmap_ideas').insert({
      title: ideaData.title, description: ideaData.description,
      category: ideaData.category, image_url: ideaData.image_url || null,
      created_by: currentUser.id,
    }).select().single();
    if (error) throw error;
    setRoadmapIdeas(prev => [data as RoadmapIdea, ...prev]);
  };

  const updateRoadmapIdea = async (id: string, updates: any) => {
    if (isGuest) {
      const updated = roadmapIdeas.map(r => r.id === id ? { ...r, ...updates, updated_at: now() } : r);
      setRoadmapIdeas(updated);
      persist('roadmap_ideas', updated);
      return;
    }
    const { error } = await supabase.from('roadmap_ideas').update(updates).eq('id', id);
    if (error) throw error;
    setRoadmapIdeas(prev => prev.map(r => r.id === id ? { ...r, ...updates, updated_at: now() } : r));
  };

  const deleteRoadmapIdea = async (id: string) => {
    if (isGuest) {
      const updated = roadmapIdeas.filter(r => r.id !== id);
      setRoadmapIdeas(updated);
      persist('roadmap_ideas', updated);
      return;
    }
    const { error } = await supabase.from('roadmap_ideas').delete().eq('id', id);
    if (error) throw error;
    setRoadmapIdeas(prev => prev.filter(r => r.id !== id));
  };

  // ─── Organizations ───────────────────────────────────────────────────────────

  const createOrganization = async (name: string): Promise<Organization> => {
    if (!currentUser) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('organizations').insert({
      name, created_by: currentUser.id,
    }).select().single();
    if (error) throw error;
    const org = data as Organization;
    setOrganizations(prev => [...prev, org].sort((a, b) => a.name.localeCompare(b.name)));
    return org;
  };

  const updateOrganization = async (id: string, updates: Partial<Organization>) => {
    const { error } = await supabase.from('organizations').update(updates).eq('id', id);
    if (error) throw error;
    setOrganizations(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteOrganization = async (id: string) => {
    const { error } = await supabase.from('organizations').delete().eq('id', id);
    if (error) throw error;
    setOrganizations(prev => prev.filter(o => o.id !== id));
    setAllProfiles(prev => prev.map(p => p.organization_id === id ? { ...p, organization_id: null } : p));
  };

  const assignUserToOrganization = async (userId: string, organizationId: string | null) => {
    const { error } = await supabase.from('profiles').update({ organization_id: organizationId }).eq('id', userId);
    if (error) throw error;
    setAllProfiles(prev => prev.map(p => p.id === userId ? { ...p, organization_id: organizationId } : p));
    if (currentUser?.id === userId) setCurrentUser(prev => prev ? { ...prev, organization_id: organizationId } : null);
  };

  // ─── Admin: Profile Management ───────────────────────────────────────────────

  const updateProfile = async (userId: string, updates: Partial<User>) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw error;
    setAllProfiles(prev => prev.map(p => p.id === userId ? { ...p, ...updates } : p));
    if (currentUser?.id === userId) setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const setUserAdmin = async (userId: string, isAdmin: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_admin: isAdmin }).eq('id', userId);
    if (error) throw error;
    setAllProfiles(prev => prev.map(p => p.id === userId ? { ...p, is_admin: isAdmin } : p));
  };

  const value: AppContextType = {
    currentUser, projects, lists, roadmapIdeas, allProfiles, organizations, pendingInvitations,
    loading: authLoading || dataLoading,
    isAuthenticated: !!user || isGuest,
    isGuest,
    continueAsGuest,

    createProject, updateProject, deleteProject, getProjectLists, getUsersInProject, getProjectMembers,
    createList, updateList, deleteList, reorderLists, reorderProjectLists,
    addTaskToList, updateTask, deleteTask, moveTask,
    addRoadmapIdea, updateRoadmapIdea, deleteRoadmapIdea,
    inviteToProject, removeFromProject, acceptInvitation, declineInvitation,
    createOrganization, updateOrganization, deleteOrganization, assignUserToOrganization,
    updateProfile, setUserAdmin,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
}
