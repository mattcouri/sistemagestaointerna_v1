import { useState, useEffect } from 'react';

// Helper function to revive Date objects from JSON
function dateReviver(key: string, value: any) {
  // Check if the value is a string that looks like an ISO date
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
    return new Date(value);
  }
  return value;
}

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item, dateReviver);
        // Merge parsed data with default value to ensure all properties exist
        if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
          return { ...defaultValue, ...parsedItem };
        }
        return parsedItem;
      }
      return defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}