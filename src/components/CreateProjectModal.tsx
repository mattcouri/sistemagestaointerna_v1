import React, { useState } from 'react';
import { X, Users, User, Palette } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { User as UserType } from '../types';

interface CreateProjectModalProps {
  onClose: () => void;
  availableUsers: UserType[];
}

export function CreateProjectModal({ onClose, availableUsers }: CreateProjectModalProps) {
  const { createProject, currentUser } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F59E0B'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && currentUser) {
      // Always include the current user in the project
      const assignedUserIds = [currentUser.id, ...selectedUsers];
      createProject(name.trim(), description.trim(), assignedUserIds, selectedColor);
      onClose();
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-800">Create New Project</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Describe the project goals and objectives"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Project Color
            </label>
            <div className="flex items-center space-x-3 mb-2">
              <Palette className="w-5 h-5 text-slate-600" />
              <div 
                className="w-8 h-8 rounded-lg border-2 border-slate-300"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-sm text-slate-600">Selected Color</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-slate-800 scale-110' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Assign Team Members
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableUsers.map(user => (
                <label
                  key={user.id}
                  className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: user.color }}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-2">
              You will be automatically added to this project
            </p>
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
              className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-700 p-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}