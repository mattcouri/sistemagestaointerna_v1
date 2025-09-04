import React, { createContext, useContext, useState, useEffect } from 'react';
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
  dueDate?: Date; // For compatibility
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
  loading: boolean;
  isAuthenticated: boolean;
  
  // Project functions
  createProject: (name: string, description: string, assignedUserIds: string[], color?: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectLists: (projectId: string) => List[];
  getUsersInProject: (projectId: string) => User[];
  
  // List functions
  createList: (title: string, type: 'personal' | 'project', projectId?: string) => Promise<void>;
  updateList: (id: string, updates: Partial<List>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  reorderLists: (userId: string, listIds: string[]) => Promise<void>;
  reorderProjectLists: (projectId: string, listIds: string[]) => Promise<void>;
  
  // Task functions
  addTaskToList: (listId: string, taskData: any) => Promise<void>;
  updateTask: (listId: string, taskId: string, updates: any) => Promise<void>;
  deleteTask: (listId: string, taskId: string) => Promise<void>;
  moveTask: (taskId: string, sourceListId: string, targetListId: string) => Promise<void>;
  
  // Roadmap functions
  addRoadmapIdea: (ideaData: any) => Promise<void>;
  updateRoadmapIdea: (id: string, updates: any) => Promise<void>;
  deleteRoadmapIdea: (id: string) => Promise<void>;
  
  // Data refresh
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSupabase();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [roadmapIdeas, setRoadmapIdeas] = useState<RoadmapIdea[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize user profile and load data
  useEffect(() => {
    if (user) {
      initializeUserAndLoadData();
    } else {
      setCurrentUser(null);
      setProjects([]);
      setLists([]);
      setRoadmapIdeas([]);
      setLoading(false);
    }
  }, [user]);

  const initializeUserAndLoadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Check if profile exists
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Create profile if it doesn't exist
      if (profileError && profileError.code === 'PGRST116') {
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
      } else if (profileError) {
        throw profileError;
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
    ]);
  };

  const loadProjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadLists = async () => {
    if (!user) return;

    try {
      // Get personal lists
      const { data: personalLists, error: personalError } = await supabase
        .from('lists')
        .select(`
          *,
          tasks (*)
        `)
        .eq('user_id', user.id)
        .eq('type', 'personal')
        .order('position', { ascending: true });

      if (personalError) throw personalError;

      // Get project memberships
      const { data: projectMemberships, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);

      let consolidatedProjectLists: List[] = [];

      if (!memberError && projectMemberships && projectMemberships.length > 0) {
        const projectIds = projectMemberships.map(m => m.project_id);
        
        // Get projects user is member of
        const { data: userProjects, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds);

        if (!projectError && userProjects) {
          // For each project, create consolidated view
          for (const project of userProjects) {
            const { data: projectLists, error: listsError } = await supabase
              .from('lists')
              .select(`
                *,
                tasks (*)
              `)
              .eq('project_id', project.id);

            if (!listsError && projectLists) {
              // Get tasks assigned to current user
              const userAssignedTasks = projectLists
                .flatMap(list => (list.tasks || []).map(task => ({
                  ...task,
                  dueDate: task.due_date ? new Date(task.due_date) : undefined
                })))
                .filter(task => task.assigned_to === user.id);

              // Create consolidated project view
              const consolidatedList: List = {
                id: `project-${project.id}`,
                title: project.name,
                strategy: `Consolidated view of ${project.name} tasks assigned to you`,
                type: 'project',
                project_id: project.id,
                user_id: user.id,
                color: project.color,
                position: (personalLists?.length || 0) + consolidatedProjectLists.length,
                created_at: project.created_at,
                updated_at: project.updated_at,
                tasks: userAssignedTasks
              };

              consolidatedProjectLists.push(consolidatedList);
            }
          }
        }
      }

      // Convert personal lists tasks
      const personalListsWithDates = (personalLists || []).map(list => ({
        ...list,
        tasks: (list.tasks || []).map(task => ({
          ...task,
          dueDate: task.due_date ? new Date(task.due_date) : undefined
        }))
      }));

      setLists([...personalListsWithDates, ...consolidatedProjectLists]);
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
      const allMemberIds = [currentUser.id, ...assignedUserIds];
      const uniqueMemberIds = [...new Set(allMemberIds)];
      
      if (uniqueMemberIds.length > 0) {
        const { error: membersError } = await supabase
          .from('project_members')
          .insert(
            uniqueMemberIds.map(userId => ({
              project_id: project.id,
              user_id: userId,
            }))
          );

        if (membersError) throw membersError;
      }

      await refreshData();
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await refreshData();
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  const getProjectLists = (projectId: string): List[] => {
    // Return actual project lists (not consolidated views)
    return lists.filter(list => list.project_id === projectId && !list.id.startsWith('project-'));
  };

  const getUsersInProject = (projectId: string): User[] => {
    // Simplified - return empty array for now
    // In full implementation, this would fetch project members
    return [];
  };

  // List functions
  const createList = async (title: string, type: 'personal' | 'project', projectId?: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('lists')
        .insert({
          title,
          strategy: '',
          type,
          project_id: projectId || null,
          user_id: currentUser.id,
          position: lists.length,
        });

      if (error) throw error;
      await loadLists();
    } catch (error) {
      console.error('Error creating list:', error);
      throw error;
    }
  };

  const updateList = async (id: string, updates: Partial<List>) => {
    try {
      const { error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await loadLists();
    } catch (error) {
      console.error('Error updating list:', error);
      throw error;
    }
  };

  const deleteList = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadLists();
    } catch (error) {
      console.error('Error deleting list:', error);
      throw error;
    }
  };

  const reorderLists = async (userId: string, listIds: string[]) => {
    // Simplified implementation
    console.log('Reorder lists:', listIds);
  };

  const reorderProjectLists = async (projectId: string, listIds: string[]) => {
    // Simplified implementation
    console.log('Reorder project lists:', listIds);
  };

  // Task functions
  const addTaskToList = async (listId: string, taskData: any) => {
    try {
      let targetListId = listId;
      
      // Handle consolidated project views
      if (listId.startsWith('project-')) {
        const projectId = listId.replace('project-', '');
        
        // Find existing list or create new one
        const { data: projectLists, error: listsError } = await supabase
          .from('lists')
          .select('*')
          .eq('project_id', projectId)
          .eq('user_id', currentUser?.id);

        if (listsError) throw listsError;

        if (projectLists && projectLists.length > 0) {
          targetListId = projectLists[0].id;
        } else {
          // Create new list
          const project = projects.find(p => p.id === projectId);
          const { data: newList, error: createError } = await supabase
            .from('lists')
            .insert({
              title: `${project?.name || 'Project'} - ${currentUser?.name}`,
              strategy: '',
              type: 'project',
              project_id: projectId,
              user_id: currentUser?.id,
              position: 0,
            })
            .select()
            .single();

          if (createError) throw createError;
          targetListId = newList.id;
        }
      }

      const { error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          tag: generateUniqueTag(),
          list_id: targetListId,
        });

      if (error) throw error;
      await loadLists();
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const updateTask = async (listId: string, taskId: string, updates: any) => {
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
  const addRoadmapIdea = async (ideaData: any) => {
    if (!currentUser) return;

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

  const updateRoadmapIdea = async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('roadmap_ideas')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await loadRoadmapIdeas();
    } catch (error) {
      console.error('Error updating roadmap idea:', error);
      throw error;
    }
  };

  const deleteRoadmapIdea = async (id: string) => {
    try {
      const { error } = await supabase
        .from('roadmap_ideas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadRoadmapIdeas();
    } catch (error) {
      console.error('Error deleting roadmap idea:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    await loadAllData();
  };

  const value: AppContextType = {
    currentUser,
    projects,
    lists,
    roadmapIdeas,
    loading,
    isAuthenticated: !!user,
    
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