import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { AppState, User, Project, List, Task, RoadmapIdea } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateId, generateUniqueTag } from '../utils/taskUtils';

interface AppContextType extends AppState {
  login: (email: string, name: string) => void;
  logout: () => void;
  createProject: (name: string, description: string, assignedUserIds: string[], color?: string) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  createList: (title: string, type: 'personal' | 'project', projectId?: string) => void;
  updateList: (listId: string, updates: Partial<List>) => void;
  deleteList: (listId: string) => void;
  addTaskToList: (listId: string, task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (listId: string, taskId: string, updates: Partial<Task>) => void;
  deleteTask: (listId: string, taskId: string) => void;
  moveTask: (taskId: string, sourceListId: string, targetListId: string) => void;
  getProjectLists: (projectId: string) => List[];
  getUsersInProject: (projectId: string) => User[];
  reorderLists: (userId: string, listIds: string[]) => void;
  reorderProjectLists: (projectId: string, listIds: string[]) => void;
  addRoadmapIdea: (ideaData: Omit<RoadmapIdea, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => void;
  updateRoadmapIdea: (ideaId: string, updates: Partial<RoadmapIdea>) => void;
  deleteRoadmapIdea: (ideaId: string) => void;
  roadmapIdeas: RoadmapIdea[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

// Sample data for demonstration
const createSampleData = (): AppState => {
  const users: User[] = [
    {
      id: 'user-1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      color: '#3B82F6',
      lists: []
    },
    {
      id: 'user-2',
      name: 'Mike Chen',
      email: 'mike@example.com',
      color: '#10B981',
      lists: []
    },
    {
      id: 'user-3',
      name: 'Emily Rodriguez',
      email: 'emily@example.com',
      color: '#8B5CF6',
      lists: []
    }
  ];

  const projects: Project[] = [
    {
      id: 'project-1',
      name: 'Website Redesign',
      description: 'Complete overhaul of company website',
      color: '#3B82F6',
      createdBy: 'user-1',
      assignedUsers: ['user-1', 'user-2'],
      createdAt: new Date()
    }
  ];

  // Add sample lists to users
  users[0].lists = [
    {
      id: 'list-1',
      title: 'Personal Development',
      strategy: 'Focus on skill improvement and learning new technologies',
      tasks: [
        {
          id: generateId(),
          tag: generateUniqueTag(),
          title: 'Complete React course',
          priority: 'high',
          completed: false,
          createdAt: new Date()
        }
      ],
      type: 'personal',
      userId: 'user-1'
    },
    {
      id: 'list-2',
      title: 'Website Redesign',
      strategy: 'Lead the design phase and coordinate with development team',
      tasks: [
        {
          id: generateId(),
          tag: generateUniqueTag(),
          title: 'Create wireframes',
          priority: 'high',
          completed: false,
          createdAt: new Date()
        }
      ],
      type: 'project',
      projectId: 'project-1',
      userId: 'user-1',
      color: '#3B82F6'
    }
  ];

  return {
    currentUser: null,
    users,
    projects,
    isAuthenticated: false,
    roadmapIdeas: []
  };
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [appData, setAppData] = useLocalStorage<AppState>('kanban-app-data', createSampleData());
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Trigger update notification whenever data changes
  const triggerUpdate = () => {
    setLastUpdate(Date.now());
  };

  const login = (email: string, name: string) => {
    let user = appData.users.find(u => u.email === email);
    
    if (!user) {
      user = {
        id: generateId(),
        name,
        email,
        color: PRESET_COLORS[appData.users.length % PRESET_COLORS.length],
        lists: []
      };
      setAppData(prev => ({
        ...prev,
        users: [...prev.users, user!]
      }));
    }

    setAppData(prev => ({
      ...prev,
      currentUser: user!,
      isAuthenticated: true
    }));
    triggerUpdate();
  };

  const logout = () => {
    setAppData(prev => ({
      ...prev,
      currentUser: null,
      isAuthenticated: false
    }));
    triggerUpdate();
  };

  const createProject = (name: string, description: string, assignedUserIds: string[], color?: string) => {
    const newProject: Project = {
      id: generateId(),
      name,
      description,
      color: color || PRESET_COLORS[appData.projects.length % PRESET_COLORS.length],
      createdBy: appData.currentUser!.id,
      assignedUsers: assignedUserIds,
      createdAt: new Date()
    };

    // Create project lists for each assigned user
    const updatedUsers = appData.users.map(user => {
      if (assignedUserIds.includes(user.id)) {
        const projectList: List = {
          id: generateId(),
          title: name,
          strategy: '',
          tasks: [],
          type: 'project',
          projectId: newProject.id,
          userId: user.id,
          color: newProject.color
        };
        return {
          ...user,
          lists: [...user.lists, projectList]
        };
      }
      return user;
    });

    setAppData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject],
      users: updatedUsers,
      currentUser: updatedUsers.find(u => u.id === appData.currentUser!.id) || appData.currentUser
    }));
    triggerUpdate();
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    const oldProject = appData.projects.find(p => p.id === projectId);
    if (!oldProject) return;

    // Handle user assignment changes
    if (updates.assignedUsers) {
      const oldUsers = oldProject.assignedUsers;
      const newUsers = updates.assignedUsers;
      
      // Remove project lists from users who are no longer assigned
      const removedUsers = oldUsers.filter(userId => !newUsers.includes(userId));
      // Add project lists to newly assigned users
      const addedUsers = newUsers.filter(userId => !oldUsers.includes(userId));
      
      const updatedUsers = appData.users.map(user => {
        if (removedUsers.includes(user.id)) {
          return {
            ...user,
            lists: user.lists.filter(list => list.projectId !== projectId)
          };
        }
        if (addedUsers.includes(user.id)) {
          const projectList: List = {
            id: generateId(),
            title: updates.name || oldProject.name,
            strategy: '',
            tasks: [],
            type: 'project',
            projectId: projectId,
            userId: user.id,
            color: oldProject.color
          };
          return {
            ...user,
            lists: [...user.lists, projectList]
          };
        }
        return user;
      });

      setAppData(prev => ({
        ...prev,
        projects: prev.projects.map(p => 
          p.id === projectId ? { ...p, ...updates } : p
        ),
        users: updatedUsers,
        currentUser: updatedUsers.find(u => u.id === appData.currentUser!.id)!
      }));
    } else {
      setAppData(prev => ({
        ...prev,
        projects: prev.projects.map(p => 
          p.id === projectId ? { ...p, ...updates } : p
        )
      }));
      triggerUpdate();
    }
  };

  const deleteProject = (projectId: string) => {
    // Remove project lists from all users
    const updatedUsers = appData.users.map(user => ({
      ...user,
      lists: user.lists.filter(list => list.projectId !== projectId)
    }));

    setAppData(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== projectId),
      users: updatedUsers
    }));
    triggerUpdate();
  };

  const createList = (title: string, type: 'personal' | 'project', projectId?: string) => {
    if (!appData.currentUser) return;

    const newList: List = {
      id: generateId(),
      title,
      strategy: '',
      tasks: [],
      type,
      projectId,
      userId: appData.currentUser.id,
      color: type === 'project' ? appData.projects.find(p => p.id === projectId)?.color : undefined
    };

    const updatedUsers = appData.users.map(user => 
      user.id === appData.currentUser!.id 
        ? { ...user, lists: [...user.lists, newList] }
        : user
    );

    setAppData(prev => ({
      ...prev,
      users: updatedUsers,
      currentUser: updatedUsers.find(u => u.id === appData.currentUser!.id)!
    }));
    triggerUpdate();
  };

  const updateList = (listId: string, updates: Partial<List>) => {
    const updatedUsers = appData.users.map(user => ({
      ...user,
      lists: user.lists.map(list => {
        if (list.id === listId) {
          return { ...list, ...updates };
        }
        // If it's a project list, sync strategy across all users
        if (list.projectId && updates.strategy && list.projectId === user.lists.find(l => l.id === listId)?.projectId) {
          return { ...list, strategy: updates.strategy };
        }
        return list;
      })
    }));

    setAppData(prev => ({
      ...prev,
      users: updatedUsers,
      currentUser: updatedUsers.find(u => u.id === appData.currentUser!.id)!
    }));
    triggerUpdate();
  };

  const deleteList = (listId: string) => {
    const updatedUsers = appData.users.map(user => ({
      ...user,
      lists: user.lists.filter(list => list.id !== listId)
    }));

    setAppData(prev => ({
      ...prev,
      users: updatedUsers,
      currentUser: updatedUsers.find(u => u.id === appData.currentUser!.id)!
    }));
    triggerUpdate();
  };

  const addTaskToList = (listId: string, taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      tag: generateUniqueTag(),
      createdAt: new Date()
    };

    const updatedUsers = appData.users.map(user => ({
      ...user,
      lists: user.lists.map(list => {
        if (list.id === listId) {
          return { ...list, tasks: [...list.tasks, newTask] };
        }
        // Sync project tasks across all users
        if (list.projectId && list.projectId === user.lists.find(l => l.id === listId)?.projectId) {
          return { ...list, tasks: [...list.tasks, newTask] };
        }
        return list;
      })
    }));

    setAppData(prev => ({
      ...prev,
      users: updatedUsers,
      currentUser: updatedUsers.find(u => u.id === appData.currentUser!.id)!
    }));
    triggerUpdate();
  };

  const updateTask = (listId: string, taskId: string, updates: Partial<Task>) => {
    const updatedUsers = appData.users.map(user => ({
      ...user,
      lists: user.lists.map(list => {
        const shouldUpdate = list.id === listId || 
          (list.projectId && list.projectId === user.lists.find(l => l.id === listId)?.projectId);
        
        if (shouldUpdate) {
          return {
            ...list,
            tasks: list.tasks.map(task => 
              task.id === taskId ? { ...task, ...updates } : task
            )
          };
        }
        return list;
      })
    }));

    setAppData(prev => ({
      ...prev,
      users: updatedUsers,
      currentUser: updatedUsers.find(u => u.id === appData.currentUser!.id)!
    }));
    triggerUpdate();
  };

  const deleteTask = (listId: string, taskId: string) => {
    const updatedUsers = appData.users.map(user => ({
      ...user,
      lists: user.lists.map(list => {
        const shouldUpdate = list.id === listId || 
          (list.projectId && list.projectId === user.lists.find(l => l.id === listId)?.projectId);
        
        if (shouldUpdate) {
          return {
            ...list,
            tasks: list.tasks.filter(task => task.id !== taskId)
          };
        }
        return list;
      })
    }));

    setAppData(prev => ({
      ...prev,
      users: updatedUsers,
      currentUser: updatedUsers.find(u => u.id === appData.currentUser!.id)!
    }));
    triggerUpdate();
  };

  const moveTask = (taskId: string, sourceListId: string, targetListId: string) => {
    if (sourceListId === targetListId) return;

    let taskToMove: Task | null = null;
    
    // Find and remove the task from source
    const usersAfterRemoval = appData.users.map(user => ({
      ...user,
      lists: user.lists.map(list => {
        const shouldRemove = list.id === sourceListId || 
          (list.projectId && list.projectId === user.lists.find(l => l.id === sourceListId)?.projectId);
        
        if (shouldRemove) {
          const task = list.tasks.find(t => t.id === taskId);
          if (task && !taskToMove) taskToMove = task;
          return {
            ...list,
            tasks: list.tasks.filter(t => t.id !== taskId)
          };
        }
        return list;
      })
    }));

    if (!taskToMove) return;

    // Add task to target
    const finalUsers = usersAfterRemoval.map(user => ({
      ...user,
      lists: user.lists.map(list => {
        const shouldAdd = list.id === targetListId || 
          (list.projectId && list.projectId === user.lists.find(l => l.id === targetListId)?.projectId);
        
        if (shouldAdd) {
          return {
            ...list,
            tasks: [...list.tasks, taskToMove!]
          };
        }
        return list;
      })
    }));

    setAppData(prev => ({
      ...prev,
      users: finalUsers,
      currentUser: finalUsers.find(u => u.id === appData.currentUser!.id)!
    }));
    triggerUpdate();
  };

  const reorderLists = (userId: string, listIds: string[]) => {
    const updatedUsers = appData.users.map(user => {
      if (user.id === userId) {
        const reorderedLists = listIds.map(listId => 
          user.lists.find(list => list.id === listId)!
        ).filter(Boolean);
        return { ...user, lists: reorderedLists };
      }
      return user;
    });

    setAppData(prev => ({
      ...prev,
      users: updatedUsers,
      currentUser: updatedUsers.find(u => u.id === appData.currentUser!.id)!
    }));
    triggerUpdate();
  };

  const reorderProjectLists = (projectId: string, listIds: string[]) => {
    // For project lists, we need to maintain the same order across all users
    const updatedUsers = appData.users.map(user => {
      const userProjectLists = user.lists.filter(list => list.projectId === projectId);
      const userOtherLists = user.lists.filter(list => list.projectId !== projectId);
      
      if (userProjectLists.length > 0) {
        const reorderedProjectLists = listIds.map(listId => 
          userProjectLists.find(list => list.id === listId)
        ).filter(Boolean);
        
        return {
          ...user,
          lists: [...userOtherLists, ...reorderedProjectLists]
        };
      }
      return user;
    });

    setAppData(prev => ({
      ...prev,
      users: updatedUsers,
      currentUser: updatedUsers.find(u => u.id === appData.currentUser!.id)!
    }));
    triggerUpdate();
  };

  const getProjectLists = (projectId: string): List[] => {
    const projectLists: List[] = [];
    appData.users.forEach(user => {
      const userProjectLists = user.lists.filter(list => list.projectId === projectId);
      projectLists.push(...userProjectLists);
    });
    return projectLists;
  };

  const getUsersInProject = (projectId: string): User[] => {
    const project = appData.projects.find(p => p.id === projectId);
    if (!project) return [];
    return appData.users.filter(user => project.assignedUsers.includes(user.id));
  };

  const addRoadmapIdea = (ideaData: Omit<RoadmapIdea, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    if (!appData.currentUser) return;

    const newIdea: RoadmapIdea = {
      ...ideaData,
      id: generateId(),
      createdBy: appData.currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setAppData(prev => ({
      ...prev,
      roadmapIdeas: [...prev.roadmapIdeas, newIdea]
    }));
    triggerUpdate();
  };

  const updateRoadmapIdea = (ideaId: string, updates: Partial<RoadmapIdea>) => {
    setAppData(prev => ({
      ...prev,
      roadmapIdeas: prev.roadmapIdeas.map(idea =>
        idea.id === ideaId
          ? { ...idea, ...updates, updatedAt: new Date() }
          : idea
      )
    }));
    triggerUpdate();
  };

  const deleteRoadmapIdea = (ideaId: string) => {
    setAppData(prev => ({
      ...prev,
      roadmapIdeas: prev.roadmapIdeas.filter(idea => idea.id !== ideaId)
    }));
    triggerUpdate();
  };

  const contextValue: AppContextType = {
    ...appData,
    lastUpdate,
    login,
    logout,
    createProject,
    updateProject,
    deleteProject,
    createList,
    updateList,
    deleteList,
    addTaskToList,
    updateTask,
    deleteTask,
    moveTask,
    getProjectLists,
    getUsersInProject,
    reorderLists,
    reorderProjectLists,
    addRoadmapIdea,
    updateRoadmapIdea,
    deleteRoadmapIdea
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