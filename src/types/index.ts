export interface Task {
  id: string;
  tag: string; // Unique tag across the platform
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: Date;
  dueDate?: Date;
  assignedTo?: string; // User ID
}

export interface List {
  id: string;
  title: string;
  strategy: string;
  tasks: Task[];
  type: 'personal' | 'project';
  projectId?: string;
  userId: string;
  color?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdBy: string;
  assignedUsers: string[];
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  lists: List[];
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
  imageUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}