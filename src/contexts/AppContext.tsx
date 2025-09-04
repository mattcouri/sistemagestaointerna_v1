import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useSupabase } from '../hooks/useSupabase';
import { generateId, generateUniqueTag } from '../utils/taskUtils';

// Updated types to match database schema
interface Profile {
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
  created_at?: string;
  updated_at?: string;
}

interface List {
  id: string;
  title: string;
  strategy: string;
  type: 'personal' | 'project';
  project_id?: string;
  user_id: string;
  color?: string;
  position: number;
  created_at?: string;
  updated_at?: string;
  tasks?: Task[];
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
  created_at?: string;
  updated_at?: string;
}

interface RoadmapIdea {
  id: string;
  title: string;
  description: string;
  category: 'new-feature' | 'improvement' | 'next-steps' | 'bug';
  image_url?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

interface AppContextType {
  currentUser: Profile | null;
  isAuthenticated: boolean;
  lists: List[];
  projects: Project[];
  roadmapIdeas: RoadmapIdea[];
  loading: boolean;
  
  // Auth functions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Project functions
  createProject: (name: string, description: string, assignedUserIds: string[], color?: string) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  
  // List functions
  createList: (title: string, type: 'personal' | 'project', projectId?: string) => Promise<void>;
  updateList: (listId: string, updates: Partial<List>) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  reorderLists: (userId: string, listIds: string[]) => Promise<void>;
  
  // Task functions
  addTaskToList: (listId: string, task: Omit<Task, 'id' | 'created_at'>) => Promise<void>;
  updateTask: (listId: string, taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (listId: string, taskId: string) => Promise<void>;
  moveTask: (taskId: string, sourceListId: string, targetListId: string) => Promise<void>;
  
  // Roadmap functions
  addRoadmapIdea: (ideaData: Omit<RoadmapIdea, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateRoadmapIdea: (ideaId: string, updates: Partial<RoadmapIdea>) => Promise<void>;
  deleteRoadmapIdea: (ideaId: string) => Promise<void>;
  
  // Utility functions
  getProjectLists: (projectId: string) => List[];
  getUsersInProject: (projectId: string) => Profile[];
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { supabase, user: supabaseUser } = useSupabase();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [roadmapIdeas, setRoadmapIdeas] = useState<RoadmapIdea[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user profile when authenticated
  useEffect(() => {
    if (supabaseUser) {
      loadUserProfile(supabaseUser.id);
    } else {
      setCurrentUser(null);
      setLists([]);
      setProjects([]);
      setRoadmapIdeas([]);
      setLoading(false);
    }
  }, [supabaseUser]);

  // Load user data when profile is set
  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser]);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setCurrentUser(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const refreshData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await Promise.all([
        loadLists(),
        loadProjects(), 
        loadRoadmapIdeas()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLists = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('lists')
        .select(`
          *,
          tasks (*)
        `)
        .eq('user_id', currentUser.id)
        .order('position', { ascending: true });

      if (error) throw error;
      setLists(data || []);
    } catch (error) {
      console.error('Error loading lists:', error);
    }
  };

  const loadProjects = async () => {
    if (!currentUser) return;

    try {
      // Get projects user created
      const { data: ownedProjects, error: ownedError } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', currentUser.id);

      if (ownedError) throw ownedError;

      // Get projects user is a member of
      const { data: memberships, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', currentUser.id);

      let memberProjects: any[] = [];
      if (!memberError && memberships && memberships.length > 0) {
        const projectIds = memberships.map(m => m.project_id);
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds);
        
        if (!error) memberProjects = data || [];
      }

      // Combine and deduplicate
      const allProjects = [...(ownedProjects || []), ...memberProjects];
      const uniqueProjects = allProjects.filter((project, index, self) => 
        index === self.findIndex(p => p.id === project.id)
      );

      setProjects(uniqueProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
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

  // Auth functions
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signup = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    if (error) throw error;
    
    // Profile will be created automatically via database trigger
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Project functions
  const createProject = async (name: string, description: string, assignedUserIds: string[], color?: string) => {
    if (!currentUser) throw new Error('Not authenticated');

    try {
      const projectColor = color || PRESET_COLORS[projects.length % PRESET_COLORS.length];
      
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name,
          description,
          color: projectColor,
          created_by: currentUser.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Add project members
      if (assignedUserIds.length > 0) {
        const { error: membersError } = await supabase
          .from('project_members')
          .insert(
            assignedUserIds.map(userId => ({
              project_id: project.id,
              user_id: userId,
            }))
          );

        if (membersError) throw membersError;
      }

      // Create project list for creator
      await supabase
        .from('lists')
        .insert({
          title: name,
          strategy: '',
          type: 'project',
          project_id: project.id,
          user_id: currentUser.id,
          color: projectColor,
          position: lists.length,
        });

      await refreshData();
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;
      await refreshData();
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      await refreshData();
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  // List functions
  const createList = async (title: string, type: 'personal' | 'project', projectId?: string) => {
    if (!currentUser) throw new Error('Not authenticated');

    try {
      const projectColor = projectId ? projects.find(p => p.id === projectId)?.color : undefined;
      
      const { error } = await supabase
        .from('lists')
        .insert({
          title,
          strategy: '',
          type,
          project_id: projectId,
          user_id: currentUser.id,
          color: projectColor,
          position: lists.length,
        });

      if (error) throw error;
      await loadLists();
    } catch (error) {
      console.error('Error creating list:', error);
      throw error;
    }
  };

  const updateList = async (listId: string, updates: Partial<List>) => {
    try {
      const { error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', listId);

      if (error) throw error;
      await loadLists();
    } catch (error) {
      console.error('Error updating list:', error);
      throw error;
    }
  };

  const deleteList = async (listId: string) => {
    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;
      await loadLists();
    } catch (error) {
      console.error('Error deleting list:', error);
      throw error;
    }
  };

  const reorderLists = async (userId: string, listIds: string[]) => {
    try {
      const updates = listIds.map((listId, index) => ({
        id: listId,
        position: index,
      }));

      for (const update of updates) {
        await supabase
          .from('lists')
          .update({ position: update.position })
          .eq('id', update.id);
      }

      await loadLists();
    } catch (error) {
      console.error('Error reordering lists:', error);
      throw error;
    }
  };

  // Task functions
  const addTaskToList = async (listId: string, taskData: Omit<Task, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          tag: generateUniqueTag(),
          list_id: listId,
        });

      if (error) throw error;
      await loadLists();
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const updateTask = async (listId: string, taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      await loadLists();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (listId: string, taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      await loadLists();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const moveTask = async (taskId: string, sourceListId: string, targetListId: string) => {
    if (sourceListId === targetListId) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ list_id: targetListId })
        .eq('id', taskId);

      if (error) throw error;
      await loadLists();
    } catch (error) {
      console.error('Error moving task:', error);
      throw error;
    }
  };

  // Roadmap functions
  const addRoadmapIdea = async (ideaData: Omit<RoadmapIdea, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!currentUser) throw new Error('Not authenticated');

    try {
      const { error } = await supabase
        .from('roadmap_ideas')
        .insert({
          ...ideaData,
          created_by: currentUser.id,
        });

      if (error) throw error;
      await loadRoadmapIdeas();
    } catch (error) {
      console.error('Error adding roadmap idea:', error);
      throw error;
    }
  };

  const updateRoadmapIdea = async (ideaId: string, updates: Partial<RoadmapIdea>) => {
    try {
      const { error } = await supabase
        .from('roadmap_ideas')
        .update(updates)
        .eq('id', ideaId);

      if (error) throw error;
      await loadRoadmapIdeas();
    } catch (error) {
      console.error('Error updating roadmap idea:', error);
      throw error;
    }
  };

  const deleteRoadmapIdea = async (ideaId: string) => {
    try {
      const { error } = await supabase
        .from('roadmap_ideas')
        .delete()
        .eq('id', ideaId);

      if (error) throw error;
      await loadRoadmapIdeas();
    } catch (error) {
      console.error('Error deleting roadmap idea:', error);
      throw error;
    }
  };

  // Utility functions
  const getProjectLists = (projectId: string): List[] => {
    return lists.filter(list => list.project_id === projectId);
  };

  const getUsersInProject = (projectId: string): Profile[] => {
    // This would need a separate query to get project members
    // For now, return empty array - can be implemented if needed
    return [];
  };

  const contextValue: AppContextType = {
    currentUser,
    isAuthenticated: !!supabaseUser,
    lists,
    projects,
    roadmapIdeas,
    loading,
    
    login,
    signup,
    logout,
    
    createProject,
    updateProject,
    deleteProject,
    
    createList,
    updateList,
    deleteList,
    reorderLists,
    
    addTaskToList,
    updateTask,
    deleteTask,
    moveTask,
    
    addRoadmapIdea,
    updateRoadmapIdea,
    deleteRoadmapIdea,
    
    getProjectLists,
    getUsersInProject,
    refreshData,
  };

  return (
    <AppContext.Provider value={contextValue}>
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