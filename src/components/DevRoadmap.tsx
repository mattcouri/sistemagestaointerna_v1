import React, { useState } from 'react';
import { Lightbulb, Plus, Edit3, Trash2, Calendar, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';

export function DevRoadmap() {
  const { currentUser, roadmapIdeas, addRoadmapIdea, updateRoadmapIdea, deleteRoadmapIdea } = useApp();
  const { t } = useLanguage();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!currentUser) return null;

  const categories = [
    { value: 'all', label: t('roadmap.allIdeas'), color: 'bg-slate-500' },
    { value: 'new-feature', label: t('roadmap.newFeature'), color: 'bg-blue-500' },
    { value: 'improvement', label: t('roadmap.improvement'), color: 'bg-green-500' },
    { value: 'next-steps', label: t('roadmap.nextSteps'), color: 'bg-yellow-500' },
    { value: 'bug', label: t('roadmap.bug'), color: 'bg-red-500' }
  ];

  const filteredIdeas = selectedCategory === 'all' 
    ? roadmapIdeas 
    : roadmapIdeas.filter(idea => idea.category === selectedCategory);

  const getCategoryInfo = (category: string) => {
    return categories.find(cat => cat.value === category) || categories[0];
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Lightbulb className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{t('roadmap.title')}</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300">{t('roadmap.subtitle')}</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>{t('roadmap.newIdea')}</span>
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(category => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                selectedCategory === category.value
                  ? `${category.color} text-white`
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
              }`}
            >
              <span>{category.label}</span>
              <span className="text-xs opacity-75">
                ({category.value === 'all' ? roadmapIdeas.length : roadmapIdeas.filter(idea => idea.category === category.value).length})
              </span>
            </button>
          ))}
        </div>

        {/* Ideas Grid */}
        {filteredIdeas.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">
              {selectedCategory === 'all' ? t('roadmap.noIdeas') : `No ${getCategoryInfo(selectedCategory).label} Ideas`}
            </h3>
            <p className="text-slate-500 dark:text-slate-500 mb-6">
              {t('roadmap.noIdeasDesc')}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              {t('roadmap.addFirstIdea')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIdeas.map(idea => {
              const categoryInfo = getCategoryInfo(idea.category);
              
              return (
                <div
                  key={idea.id}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  {idea.image_url && (
                    <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-t-lg overflow-hidden">
                      <img 
                        src={idea.image_url} 
                        alt={idea.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-2 py-1 text-xs rounded-full text-white ${categoryInfo.color}`}>
                        {categoryInfo.label}
                      </span>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setEditingIdea(idea)}
                          className="w-8 h-8 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
                          title="Edit idea"
                        >
                          <Edit3 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this idea?')) {
                              deleteRoadmapIdea(idea.id);
                            }
                          }}
                          className="w-8 h-8 bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full flex items-center justify-center transition-colors"
                          title="Delete idea"
                        >
                          <Trash2 className="w-4 h-4 text-slate-600 dark:text-slate-400 hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                      {idea.title}
                    </h3>
                    
                    <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-3">
                      {idea.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold bg-blue-500">
                          {currentUser.name.charAt(0)}
                        </div>
                        <span>{currentUser.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(idea.created_at || '').toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal placeholder - you can add the modal component here */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
              <p>Create idea modal - implement as needed</p>
              <button onClick={() => setShowCreateModal(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}