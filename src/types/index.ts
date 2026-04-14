export interface Task {
  id: string;
  tag: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  list_id: string;
  assigned_to?: string;
  due_date?: string;
  dueDate?: Date;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface List {
  id: string;
  title: string;
  strategy?: string;
  tasks: Task[];
  type: 'personal' | 'project';
  project_id?: string;
  user_id: string;
  color?: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
}

export interface DraggedTask {
  task: Task;
  sourceListId: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  isAuthenticated: boolean;
  lastUpdate?: number;
  roadmapIdeas: RoadmapIdea[];
}

export interface RoadmapIdea {
  id: string;
  title: string;
  description: string;
  category: 'new-feature' | 'improvement' | 'next-steps' | 'bug';
  image_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}
