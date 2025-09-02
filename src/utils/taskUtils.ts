import { Task } from '../types';

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function generateUniqueTag(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 4);
  return `${timestamp}-${random}`.toUpperCase();
}

export function createTask(title: string, priority: Task['priority'] = 'medium'): Task {
  return {
    id: generateId(),
    tag: generateUniqueTag(),
    title,
    priority,
    completed: false,
    createdAt: new Date(),
  };
}

export function getPriorityColor(priority: Task['priority']): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    case 'medium':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    case 'low':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    default:
      return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300';
  }
}