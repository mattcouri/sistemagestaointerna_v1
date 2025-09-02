import React, { useState } from 'react';
import { X, Users, User, Trash2, UserPlus, UserMinus, Palette } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Project, User as UserType } from '../types';

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  availableUsers: UserType[];
}

export function EditProjectModal({ project, onClose, availableUsers }: EditProjectModalProps) {
  const { updateProject, deleteProject, currentUser } = useApp();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [assignedUsers, setAssignedUsers] = useState<string[]>(project.assignedUsers);
  const [selectedColor, setSelectedColor] = useState(project.color);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F59E0B'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      updateProject(project.id, {
        name: name.trim(),
        description: description.trim(),
        assignedUsers,
        color: selectedColor
      });
      onClose();
    }
  };

  const handleDelete = () => {
    deleteProject(project.id);
    onClose();
  };

  const toggleUser = (userId: string) => {
    setAssignedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const assignedUserObjects = availableUsers.filter(user => assignedUsers.includes(user.id));
  const unassignedUsers = availableUsers.filter(user => !assignedUsers.includes(user.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-800">Edit Project</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Team Members
            </label>
            
            {/* Current Members */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Current Members ({assignedUserObjects.length})
              </h4>
              <div className="space-y-2">
                {assignedUserObjects.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
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
                    {user.id !== currentUser?.id && (
                      <button
                        type="button"
                        onClick={() => toggleUser(user.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Remove from project"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Available Users */}
            {unassignedUsers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-600 mb-2">
                  Add Members
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {unassignedUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
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
                      <button
                        type="button"
                        onClick={() => toggleUser(user.id)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Add to project"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Project</span>
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-300 hover:bg-slate-400 text-slate-700 px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Delete Project</h3>
              <p className="text-slate-600 mb-4">
                Are you sure you want to delete "{project.name}"? This action cannot be undone and will remove all project data.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-700 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}