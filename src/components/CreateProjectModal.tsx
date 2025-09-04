import React, { useState } from 'react';
import { X, Palette } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface CreateProjectModalProps {
  onClose: () => void;
  availableUsers: any[]; // Simplified since we don't have users system yet
}

export function CreateProjectModal({ onClose, availableUsers }: CreateProjectModalProps) {
  const { createProject, currentUser } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F59E0B'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && currentUser) {
      // For now, just create project with current user
      createProject(name.trim(), description.trim(), [], selectedColor);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Create New Project</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              placeholder="Enter project name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-slate-700 dark:text-white"
              rows={3}
              placeholder="Describe the project goals and objectives"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Project Color
            </label>
            <div className="flex items-center space-x-3 mb-2">
              <Palette className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <div 
                className="w-8 h-8 rounded-lg border-2 border-slate-300 dark:border-slate-600"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">Selected Color</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-slate-800 dark:border-slate-200 scale-110' 
                      : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors"
            >
              Create Project
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 p-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}