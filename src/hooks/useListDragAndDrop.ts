import { useState } from 'react';

interface DraggedList {
  listId: string;
  sourceIndex: number;
}

export function useListDragAndDrop() {
  const [draggedList, setDraggedList] = useState<DraggedList | null>(null);

  const handleListDragStart = (listId: string, sourceIndex: number) => {
    setDraggedList({ listId, sourceIndex });
  };

  const handleListDragEnd = () => {
    setDraggedList(null);
  };

  const handleListDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleListDrop = (
    e: React.DragEvent, 
    targetIndex: number, 
    onReorder: (sourceIndex: number, targetIndex: number) => void
  ) => {
    e.preventDefault();
    
    if (!draggedList) return;
    
    const { sourceIndex } = draggedList;
    
    if (sourceIndex === targetIndex) return;

    onReorder(sourceIndex, targetIndex);
    setDraggedList(null);
  };

  return {
    draggedList,
    handleListDragStart,
    handleListDragEnd,
    handleListDragOver,
    handleListDrop,
  };
}