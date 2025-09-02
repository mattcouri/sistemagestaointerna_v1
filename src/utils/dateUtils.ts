export function getCurrentWeek(): { start: Date; end: Date } {
  const now = new Date();
  const startOfWeek = new Date(now);
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Make Monday the first day
  
  startOfWeek.setDate(now.getDate() + diff);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return { start: startOfWeek, end: endOfWeek };
}

export function formatWeekRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric' 
  };
  
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}

export function isTaskDueThisWeek(dueDate?: Date): boolean {
  if (!dueDate) return false;
  
  const { start, end } = getCurrentWeek();
  return dueDate >= start && dueDate <= end;
}