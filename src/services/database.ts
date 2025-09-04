import { supabase } from '../lib/supabase';
import { User, Project, List, Task, RoadmapIdea } from '../types';

// Profile operations (replaces user operations)
export const profileService = {
  async createProfile(profileData: Omit<User, 'id' | 'lists'>) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getProfile(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async updateProfile(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Project operations
export const projectService = {
  async createProject(projectData: Omit<Project, 'id' | 'createdAt'>) {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([{
        name: projectData.name,
        description: projectData.description,
        color: projectData.color,
        created_by: projectData.createdBy
      }])
      .select()
      .single();
    
    if (projectError) throw projectError;

    // Add project members
    if (projectData.assignedUsers.length > 0) {
      const memberInserts = projectData.assignedUsers.map(userId => ({
        project_id: project.id,
        user_id: userId
      }));

      const { error: membersError } = await supabase
        .from('project_members')
        .insert(memberInserts);
      
      if (membersError) throw membersError;
    }

    return project;
  },

  async getUserProjects(userId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_members!inner(user_id)
      `)
      .eq('project_members.user_id', userId);
    
    if (error) throw error;
    return data;
  },

  async getProjectMembers(projectId: string) {
    const { data, error } = await supabase
      .from('project_members')
      .select(`
        user_id,
        profiles(*)
      `)
      .eq('project_id', projectId);
    
    if (error) throw error;
    return data.map(item => item.profiles);
  },

  async updateProject(id: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteProject(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// List operations
export const listService = {
  async createList(listData: Omit<List, 'id' | 'tasks'>) {
    const { data, error } = await supabase
      .from('lists')
      .insert([{
        title: listData.title,
        strategy: listData.strategy,
        type: listData.type,
        project_id: listData.projectId,
        user_id: listData.userId,
        color: listData.color,
        position: listData.position || 0
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUserLists(userId: string) {
    const { data, error } = await supabase
      .from('lists')
      .select(`
        *,
        tasks(*)
      `)
      .eq('user_id', userId)
      .order('position');
    
    if (error) throw error;
    return data;
  },

  async getProjectLists(projectId: string) {
    const { data, error } = await supabase
      .from('lists')
      .select(`
        *,
        tasks(*),
        profiles(name, email, color)
      `)
      .eq('project_id', projectId)
      .order('position');
    
    if (error) throw error;
    return data;
  },

  async updateList(id: string, updates: Partial<List>) {
    const { data, error } = await supabase
      .from('lists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteList(id: string) {
    const { error } = await supabase
      .from('lists')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Task operations
export const taskService = {
  async createTask(taskData: Omit<Task, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        tag: taskData.tag,
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        completed: taskData.completed,
        list_id: taskData.listId,
        assigned_to: taskData.assignedTo,
        due_date: taskData.dueDate?.toISOString(),
        position: taskData.position || 0
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTask(id: string, updates: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        due_date: updates.dueDate?.toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async moveTask(taskId: string, newListId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ list_id: newListId })
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Roadmap ideas operations
export const roadmapService = {
  async createIdea(ideaData: Omit<RoadmapIdea, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('roadmap_ideas')
      .insert([{
        title: ideaData.title,
        description: ideaData.description,
        category: ideaData.category,
        image_url: ideaData.imageUrl,
        created_by: ideaData.createdBy
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getAllIdeas() {
    const { data, error } = await supabase
      .from('roadmap_ideas')
      .select(`
        *,
        profiles(name, email, color)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateIdea(id: string, updates: Partial<RoadmapIdea>) {
    const { data, error } = await supabase
      .from('roadmap_ideas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteIdea(id: string) {
    const { error } = await supabase
      .from('roadmap_ideas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Legacy export for backward compatibility
export const userService = profileService;