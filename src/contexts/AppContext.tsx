import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabase } from '../hooks/useSupabase';
import { generateUniqueTag } from '../utils/taskUtils';

interface User {
  id: string;
  name: string;
  email: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface List {
  id: string;
  title: string;
  strategy?: string;
  type: 'personal' | 'project';
  project_id?: string;
  user_id: string;
  color?: string;
  position: number;
  created_at: string;
  updated_at: string;
  tasks: Task[];
}

interface Task {
  id: string;
  tag: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  list_id: string;
  assigned_to?: string;
  due_date?: string;
  position: number;
  created_at: string;
  updated_at: string;
  dueDate?: Date;
}

interface RoadmapIdea {
  id: string;
  title: string;
  description: string;
  category: 'new-feature' | 'improvement' | 'next-steps' | 'bug';
  image_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface AppContextType {
  currentUser: User | null;
  projects: Project[];
  lists: List[];
  roadmapIdeas: RoadmapIdea[];
  allProfiles: User[];
  loading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  continueAsGuest: () => void;

  createProject: (name: string, description: string, assignedUserIds: string[], color?: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectLists: (projectId: string) => List[];
  getUsersInProject: (projectId: string) => User[];

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

  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSupabase();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [roadmapIdeas, setRoadmapIdeas] = useState<RoadmapIdea[]>([]);
  const [allProfiles, setAllProfiles] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const continueAsGuest = () => {
    setIsGuest(true);
    setCurrentUser(GUEST_USER);
    setProjects([]);
    setLists([]);
    setRoadmapIdeas([]);
    setAllProfiles([GUEST_USER]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      setIsGuest(false);
      initializeUserAndLoadData();
    } else if (!isGuest) {
      setCurrentUser(null);
      setProjects([]);
      setLists([]);
      setRoadmapIdeas([]);
      setAllProfiles([]);
      setLoading(false);
    }
  }, [user]);

  const initializeUserAndLoadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        const newProfile = {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) throw createError;
        profile = createdProfile;
      }

      setCurrentUser(profile);
      await loadAllData();
    } catch (error) {
      console.error('Error initializing user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    await Promise.all([
      loadProjects(),
      loadLists(),
      loadRoadmapIdeas(),
      loadAllProfiles(),
    ]);
  };

  const loadAllProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      if (error) throw error;
      setAllProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const loadProjects = async () => {
    if (!user) return;

    try {
      const { data: memberRows, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const memberProjectIds = (memberRows || []).map(r => r.project_id);

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .or(`created_by.eq.${user.id}${memberProjectIds.length ? `,id.in.(${memberProjectIds.join(',')})` : ''}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const unique = Array.from(new Map((data || []).map(p => [p.id, p])).values());
      setProjects(unique);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadLists = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('lists')
        .select(`*, tasks (*)`)
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (error) throw error;

      const listsWithDates = (data || []).map(list => ({
        ...list,
        tasks: (list.tasks || [])
          .sort((a: Task, b: Task) => a.position - b.position)
          .map((task: Task) => ({
            ...task,
            dueDate: task.due_date ? new Date(task.due_date) : undefined,
          })),
      }));

      setLists(listsWithDates);
    } catch (error) {
      console.error('Error loading lists:', error);
    }
  };

  const loadRoadmapIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from('roadmap_ideas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoadmapIdeas(data || []);
    } catch (error) {
      console.error('Error loading roadmap ideas:', error);
    }
  };

  const createProject = async (name: string, description: string, assignedUserIds: string[], color?: string) => {
    if (isGuest) {
      const newProject: Project = {
        id: makeId(),
        name,
        description,
        color: color || PRESET_COLORS[projects.length % PRESET_COLORS.length],
        created_by: GUEST_USER.id,
        created_at: now(),
        updated_at: now(),
      };
      setProjects(prev => [newProject, ...prev]);
      return;
    }

    if (!currentUser) throw new Error('Not authenticated');

    try {
      const projectColor = color || PRESET_COLORS[projects.length % PRESET_COLORS.length];

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({ name, description, color: projectColor, created_by: currentUser.id })
        .select()
        .single();

      if (projectError) throw projectError;

      const allMemberIds = [...new Set([currentUser.id, ...assignedUserIds])];

      const { error: membersError } = await supabase
        .from('project_members')
        .insert(allMemberIds.map(userId => ({ project_id: project.id, user_id: userId })));

      if (membersError) throw membersError;

      await loadProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (isGuest) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates, updated_at: now() } : p));
      return;
    }

    try {
      const { error } = await supabase.from('projects').update(updates).eq('id', id);
      if (error) throw error;
      await loadProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    if (isGuest) {
      setProjects(prev => prev.filter(p => p.id !== id));
      setLists(prev => prev.filter(l => l.project_id !== id));
      return;
    }

    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      await loadProjects();
      await loadLists();
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  const getProjectLists = (projectId: string): List[] => {
    return lists.filter(list => list.project_id === projectId);
  };

  const getUsersInProject = useCallback((projectId: string): User[] => {
    return allProfiles;
  }, [allProfiles]);

  const createList = async (title: string, type: 'personal' | 'project', projectId?: string) => {
    if (isGuest) {
      const newList: List = {
        id: makeId(),
        title,
        strategy: '',
        type,
        project_id: projectId,
        user_id: GUEST_USER.id,
        color: undefined,
        position: lists.length,
        created_at: now(),
        updated_at: now(),
        tasks: [],
      };
      setLists(prev => [...prev, newList]);
      return;
    }

    if (!currentUser) return;

    try {
      const listData: any = {
        title,
        strategy: '',
        type,
        user_id: currentUser.id,
        position: lists.filter(l => l.user_id === currentUser.id).length,
        project_id: type === 'project' && projectId ? projectId : null,
      };

      const { data, error } = await supabase.from('lists').insert(listData).select().single();
      if (error) throw error;

      setLists(prev => [...prev, { ...data, tasks: [] }]);
    } catch (error) {
      console.error('Error creating list:', error);
      throw error;
    }
  };

  const updateList = async (id: string, updates: Partial<List>) => {
    if (isGuest) {
      setLists(prev => prev.map(l => l.id === id ? { ...l, ...updates, updated_at: now() } : l));
      return;
    }

    try {
      const { strategy, title, color, position } = updates as any;
      const dbUpdates: any = {};
      if (strategy !== undefined) dbUpdates.strategy = strategy;
      if (title !== undefined) dbUpdates.title = title;
      if (color !== undefined) dbUpdates.color = color;
      if (position !== undefined) dbUpdates.position = position;

      const { error } = await supabase.from('lists').update(dbUpdates).eq('id', id);
      if (error) throw error;

      setLists(prev => prev.map(l => l.id === id ? { ...l, ...updates, updated_at: now() } : l));
    } catch (error) {
      console.error('Error updating list:', error);
      throw error;
    }
  };

  const deleteList = async (id: string) => {
    if (isGuest) {
      setLists(prev => prev.filter(l => l.id !== id));
      return;
    }

    try {
      const { error } = await supabase.from('lists').delete().eq('id', id);
      if (error) throw error;
      setLists(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error('Error deleting list:', error);
      throw error;
    }
  };

  const reorderLists = async (userId: string, listIds: string[]) => {
    const updates = listIds.map((id, index) => ({ id, position: index }));
    setLists(prev => {
      const map = new Map(updates.map(u => [u.id, u.position]));
      return [...prev].sort((a, b) => (map.get(a.id) ?? a.position) - (map.get(b.id) ?? b.position));
    });

    if (!isGuest) {
      await Promise.all(
        updates.map(({ id, position }) =>
          supabase.from('lists').update({ position }).eq('id', id)
        )
      );
    }
  };

  const reorderProjectLists = async (projectId: string, listIds: string[]) => {
    const updates = listIds.map((id, index) => ({ id, position: index }));
    setLists(prev => {
      const map = new Map(updates.map(u => [u.id, u.position]));
      return [...prev].sort((a, b) => (map.get(a.id) ?? a.position) - (map.get(b.id) ?? b.position));
    });

    if (!isGuest) {
      await Promise.all(
        updates.map(({ id, position }) =>
          supabase.from('lists').update({ position }).eq('id', id)
        )
      );
    }
  };

  const addTaskToList = async (listId: string, taskData: any) => {
    const tag = generateUniqueTag();
    const targetListId = listId;

    if (isGuest) {
      const newTask: Task = {
        id: makeId(),
        tag,
        title: taskData.title,
        description: taskData.description || undefined,
        priority: taskData.priority || 'medium',
        completed: false,
        list_id: targetListId,
        assigned_to: taskData.assigned_to || undefined,
        due_date: taskData.due_date || undefined,
        position: taskData.position || 0,
        created_at: now(),
        updated_at: now(),
        dueDate: taskData.due_date ? new Date(taskData.due_date) : undefined,
      };
      setLists(prev =>
        prev.map(l => l.id === targetListId ? { ...l, tasks: [...l.tasks, newTask] } : l)
      );
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...taskData, tag, list_id: targetListId })
        .select()
        .single();

      if (error) throw error;

      const newTask = { ...data, dueDate: data.due_date ? new Date(data.due_date) : undefined };
      setLists(prev =>
        prev.map(l => l.id === targetListId ? { ...l, tasks: [...l.tasks, newTask] } : l)
      );
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const updateTask = async (listId: string, taskId: string, updates: any) => {
    if (isGuest) {
      setLists(prev =>
        prev.map(l =>
          l.id === listId
            ? { ...l, tasks: l.tasks.map(t => t.id === taskId ? { ...t, ...updates, updated_at: now() } : t) }
            : l
        )
      );
      return;
    }

    try {
      const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
      if (error) throw error;

      setLists(prev =>
        prev.map(l =>
          l.id === listId
            ? {
                ...l,
                tasks: l.tasks.map(t =>
                  t.id === taskId
                    ? { ...t, ...updates, dueDate: updates.due_date ? new Date(updates.due_date) : t.dueDate, updated_at: now() }
                    : t
                ),
              }
            : l
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (listId: string, taskId: string) => {
    if (isGuest) {
      setLists(prev =>
        prev.map(l =>
          l.id === listId ? { ...l, tasks: l.tasks.filter(t => t.id !== taskId) } : l
        )
      );
      return;
    }

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;

      setLists(prev =>
        prev.map(l =>
          l.id === listId ? { ...l, tasks: l.tasks.filter(t => t.id !== taskId) } : l
        )
      );
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const moveTask = async (taskId: string, sourceListId: string, targetListId: string) => {
    if (isGuest) {
      setLists(prev => {
        const task = prev.find(l => l.id === sourceListId)?.tasks.find(t => t.id === taskId);
        if (!task) return prev;
        return prev.map(l => {
          if (l.id === sourceListId) return { ...l, tasks: l.tasks.filter(t => t.id !== taskId) };
          if (l.id === targetListId) return { ...l, tasks: [...l.tasks, { ...task, list_id: targetListId }] };
          return l;
        });
      });
      return;
    }

    try {
      const { error } = await supabase.from('tasks').update({ list_id: targetListId }).eq('id', taskId);
      if (error) throw error;

      setLists(prev => {
        const task = prev.find(l => l.id === sourceListId)?.tasks.find(t => t.id === taskId);
        if (!task) return prev;
        return prev.map(l => {
          if (l.id === sourceListId) return { ...l, tasks: l.tasks.filter(t => t.id !== taskId) };
          if (l.id === targetListId) return { ...l, tasks: [...l.tasks, { ...task, list_id: targetListId }] };
          return l;
        });
      });
    } catch (error) {
      console.error('Error moving task:', error);
      throw error;
    }
  };

  const addRoadmapIdea = async (ideaData: any) => {
    if (isGuest) {
      const newIdea: RoadmapIdea = {
        id: makeId(),
        title: ideaData.title,
        description: ideaData.description,
        category: ideaData.category,
        image_url: ideaData.image_url || undefined,
        created_by: GUEST_USER.id,
        created_at: now(),
        updated_at: now(),
      };
      setRoadmapIdeas(prev => [newIdea, ...prev]);
      return;
    }

    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('roadmap_ideas')
        .insert({ ...ideaData, created_by: currentUser.id })
        .select()
        .single();

      if (error) throw error;
      setRoadmapIdeas(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding roadmap idea:', error);
      throw error;
    }
  };

  const updateRoadmapIdea = async (id: string, updates: any) => {
    if (isGuest) {
      setRoadmapIdeas(prev => prev.map(r => r.id === id ? { ...r, ...updates, updated_at: now() } : r));
      return;
    }

    try {
      const { error } = await supabase.from('roadmap_ideas').update(updates).eq('id', id);
      if (error) throw error;
      setRoadmapIdeas(prev => prev.map(r => r.id === id ? { ...r, ...updates, updated_at: now() } : r));
    } catch (error) {
      console.error('Error updating roadmap idea:', error);
      throw error;
    }
  };

  const deleteRoadmapIdea = async (id: string) => {
    if (isGuest) {
      setRoadmapIdeas(prev => prev.filter(r => r.id !== id));
      return;
    }

    try {
      const { error } = await supabase.from('roadmap_ideas').delete().eq('id', id);
      if (error) throw error;
      setRoadmapIdeas(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting roadmap idea:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    if (!isGuest) {
      await loadAllData();
    }
  };

  const value: AppContextType = {
    currentUser,
    projects,
    lists,
    roadmapIdeas,
    allProfiles,
    loading,
    isAuthenticated: !!user || isGuest,
    isGuest,
    continueAsGuest,

    createProject,
    updateProject,
    deleteProject,
    getProjectLists,
    getUsersInProject,

    createList,
    updateList,
    deleteList,
    reorderLists,
    reorderProjectLists,

    addTaskToList,
    updateTask,
    deleteTask,
    moveTask,

    addRoadmapIdea,
    updateRoadmapIdea,
    deleteRoadmapIdea,

    refreshData,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
