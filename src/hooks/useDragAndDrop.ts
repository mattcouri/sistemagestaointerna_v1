import { useState } from 'react';
import { Task } from '../types';

interface DraggedTask {
  task: Task;
  sourceListId: string;
}

export function useDragAndDrop() {
  const [draggedTask, setDraggedTask] = useState<DraggedTask | null>(null);
  const [dropTarget, setDropTarget] = useState<{ listId: string; index: number } | null>(null);

  const handleDragStart = (task: Task, sourceListId: string) => {
    setDraggedTask({ task, sourceListId });
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTaskDragOver = (e: React.DragEvent, listId: string, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget({ listId, index });
  };

  const handleListAreaDragOver = (e: React.DragEvent, listId: string, taskCount: number) => {
    e.preventDefault();
    setDropTarget({ listId, index: taskCount });
  };

  const clearDropTarget = () => setDropTarget(null);

  return {
    draggedTask,
    dropTarget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleTaskDragOver,
    handleListAreaDragOver,
    clearDropTarget,
  };
}
