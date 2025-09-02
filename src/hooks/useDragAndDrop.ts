import { useState } from 'react';
import { Task } from '../types';

interface DraggedTask {
  task: Task;
  sourceListId: string;
}

export function useDragAndDrop() {
  const [draggedTask, setDraggedTask] = useState<DraggedTask | null>(null);

  const handleDragStart = (task: Task, sourceListId: string) => {
    setDraggedTask({ task, sourceListId });
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return {
    draggedTask,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
  };
}