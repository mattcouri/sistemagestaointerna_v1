import React, { createContext, useContext, useState, useEffect } from 'react';
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

const MATT_PROFILE: User = {
  id: 'matt-user-001',
  name: 'Matt',
  email: 'matt@trinitygroup.com.br',
  color: '#3B82F6',
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
    // ignore storage errors
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useSupabase();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [roadmapIdeas, setRoadmapIdeas] = useState<RoadmapIdea[]>([]);
  const [allProfiles, setAllProfiles] = useState<User[]>([]);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      setIsGuest(false);
      const profile: User = {
        id: user.id,
        name: user.user_metadata?.name || user.email.split('@')[0],
        email: user.email,
        color: MATT_PROFILE.color,
      };
      setCurrentUser(profile);
      setAllProfiles([profile]);
      setProjects(loadFromStorage(user.id, 'projects', []));
      setLists(loadFromStorage<List[]>(user.id, 'lists', []).map(l => ({
        ...l,
        tasks: (l.tasks || []).map(t => ({
          ...t,
          dueDate: t.due_date ? new Date(t.due_date) : undefined,
        })),
      })));
      setRoadmapIdeas(loadFromStorage(user.id, 'roadmap_ideas', []));
    } else if (!isGuest) {
      setCurrentUser(null);
      setProjects([]);
      setLists([]);
      setRoadmapIdeas([]);
      setAllProfiles([]);
    }
  }, [user, authLoading]);

  const userId = user?.id ?? (isGuest ? 'guest' : null);

  const persist = (key: string, value: any) => {
    if (userId) saveToStorage(userId, key, value);
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setCurrentUser(GUEST_USER);
    setProjects([]);
    setLists([]);
    setRoadmapIdeas([]);
    setAllProfiles([GUEST_USER]);
  };

  const createProject = async (name: string, description: string, _assignedUserIds: string[], color?: string) => {
    const newProject: Project = {
      id: makeId(),
      name,
      description,
      color: color || PRESET_COLORS[projects.length % PRESET_COLORS.length],
      created_by: currentUser?.id || GUEST_USER.id,
      created_at: now(),
      updated_at: now(),
    };
    const updated = [newProject, ...projects];
    setProjects(updated);
    persist('projects', updated);
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const updated = projects.map(p => p.id === id ? { ...p, ...updates, updated_at: now() } : p);
    setProjects(updated);
    persist('projects', updated);
  };

  const deleteProject = async (id: string) => {
    const updatedProjects = projects.filter(p => p.id !== id);
    const updatedLists = lists.filter(l => l.project_id !== id);
    setProjects(updatedProjects);
    setLists(updatedLists);
    persist('projects', updatedProjects);
    persist('lists', updatedLists);
  };

  const getProjectLists = (projectId: string): List[] => {
    return lists.filter(list => list.project_id === projectId);
  };

  const getUsersInProject = (projectId: string): User[] => {
    return allProfiles;
  };

  const createList = async (title: string, type: 'personal' | 'project', projectId?: string) => {
    const newList: List = {
      id: makeId(),
      title,
      strategy: '',
      type,
      project_id: projectId,
      user_id: currentUser?.id || GUEST_USER.id,
      color: undefined,
      position: lists.length,
      created_at: now(),
      updated_at: now(),
      tasks: [],
    };
    const updated = [...lists, newList];
    setLists(updated);
    persist('lists', updated);
  };

  const updateList = async (id: string, updates: Partial<List>) => {
    const updated = lists.map(l => l.id === id ? { ...l, ...updates, updated_at: now() } : l);
    setLists(updated);
    persist('lists', updated);
  };

  const deleteList = async (id: string) => {
    const updated = lists.filter(l => l.id !== id);
    setLists(updated);
    persist('lists', updated);
  };

  const reorderLists = async (_userId: string, listIds: string[]) => {
    const map = new Map(listIds.map((id, idx) => [id, idx]));
    const updated = [...lists].sort((a, b) => (map.get(a.id) ?? a.position) - (map.get(b.id) ?? b.position));
    setLists(updated);
    persist('lists', updated);
  };

  const reorderProjectLists = async (_projectId: string, listIds: string[]) => {
    const map = new Map(listIds.map((id, idx) => [id, idx]));
    const updated = [...lists].sort((a, b) => (map.get(a.id) ?? a.position) - (map.get(b.id) ?? b.position));
    setLists(updated);
    persist('lists', updated);
  };

  const addTaskToList = async (listId: string, taskData: any) => {
    const tag = generateUniqueTag();
    const newTask: Task = {
      id: makeId(),
      tag,
      title: taskData.title,
      description: taskData.description || undefined,
      priority: taskData.priority || 'medium',
      completed: false,
      list_id: listId,
      assigned_to: taskData.assigned_to || undefined,
      due_date: taskData.due_date || undefined,
      position: taskData.position || 0,
      created_at: now(),
      updated_at: now(),
      dueDate: taskData.due_date ? new Date(taskData.due_date) : undefined,
    };
    const updated = lists.map(l =>
      l.id === listId ? { ...l, tasks: [...l.tasks, newTask] } : l
    );
    setLists(updated);
    persist('lists', updated);
  };

  const updateTask = async (listId: string, taskId: string, updates: any) => {
    const updated = lists.map(l =>
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
    );
    setLists(updated);
    persist('lists', updated);
  };

  const deleteTask = async (listId: string, taskId: string) => {
    const updated = lists.map(l =>
      l.id === listId ? { ...l, tasks: l.tasks.filter(t => t.id !== taskId) } : l
    );
    setLists(updated);
    persist('lists', updated);
  };

  const moveTask = async (taskId: string, sourceListId: string, targetListId: string) => {
    const task = lists.find(l => l.id === sourceListId)?.tasks.find(t => t.id === taskId);
    if (!task) return;
    const updated = lists.map(l => {
      if (l.id === sourceListId) return { ...l, tasks: l.tasks.filter(t => t.id !== taskId) };
      if (l.id === targetListId) return { ...l, tasks: [...l.tasks, { ...task, list_id: targetListId }] };
      return l;
    });
    setLists(updated);
    persist('lists', updated);
  };

  const addRoadmapIdea = async (ideaData: any) => {
    const newIdea: RoadmapIdea = {
      id: makeId(),
      title: ideaData.title,
      description: ideaData.description,
      category: ideaData.category,
      image_url: ideaData.image_url || undefined,
      created_by: currentUser?.id || GUEST_USER.id,
      created_at: now(),
      updated_at: now(),
    };
    const updated = [newIdea, ...roadmapIdeas];
    setRoadmapIdeas(updated);
    persist('roadmap_ideas', updated);
  };

  const updateRoadmapIdea = async (id: string, updates: any) => {
    const updated = roadmapIdeas.map(r => r.id === id ? { ...r, ...updates, updated_at: now() } : r);
    setRoadmapIdeas(updated);
    persist('roadmap_ideas', updated);
  };

  const deleteRoadmapIdea = async (id: string) => {
    const updated = roadmapIdeas.filter(r => r.id !== id);
    setRoadmapIdeas(updated);
    persist('roadmap_ideas', updated);
  };

  const refreshData = async () => {};

  const value: AppContextType = {
    currentUser,
    projects,
    lists,
    roadmapIdeas,
    allProfiles,
    loading: authLoading,
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
