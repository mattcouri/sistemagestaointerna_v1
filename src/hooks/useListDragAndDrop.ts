import { useState } from 'react';

interface DraggedList {
  listId: string;
  sourceIndex: number;
}

export function useListDragAndDrop() {
  const [draggedList, setDraggedList] = useState<DraggedList | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const handleListDragStart = (listId: string, sourceIndex: number) => {
    setDraggedList({ listId, sourceIndex });
  };

  const handleListDragEnd = () => {
    setDraggedList(null);
    setDropTargetIndex(null);
  };

  const handleListDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedList && index !== draggedList.sourceIndex) {
      setDropTargetIndex(index);
    }
  };

  const handleListDrop = (
    e: React.DragEvent,
    targetIndex: number,
    onReorder: (sourceIndex: number, targetIndex: number) => void
  ) => {
    e.preventDefault();

    if (!draggedList) return;

    const { sourceIndex } = draggedList;

    if (sourceIndex !== targetIndex) {
      onReorder(sourceIndex, targetIndex);
    }

    setDraggedList(null);
    setDropTargetIndex(null);
  };

  return {
    draggedList,
    dropTargetIndex,
    handleListDragStart,
    handleListDragEnd,
    handleListDragOver,
    handleListDrop,
  };
}
