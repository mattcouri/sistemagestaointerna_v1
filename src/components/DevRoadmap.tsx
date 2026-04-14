import React, { useState } from 'react';
import { Lightbulb, Plus, CreditCard as Edit3, Trash2, Calendar, X, Tag } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';

type Category = 'new-feature' | 'improvement' | 'next-steps' | 'bug';

interface IdeaFormData {
  title: string;
  description: string;
  category: Category;
  image_url: string;
}

const EMPTY_FORM: IdeaFormData = {
  title: '',
  description: '',
  category: 'new-feature',
  image_url: '',
};

function IdeaModal({
  initial,
  onSave,
  onClose,
  categories,
  t,
}: {
  initial: IdeaFormData;
  onSave: (data: IdeaFormData) => Promise<void>;
  onClose: () => void;
  categories: { value: string; label: string; color: string }[];
  t: (key: string) => string;
}) {
  const [form, setForm] = useState<IdeaFormData>(initial);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!initial.title;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {isEdit ? t('common.edit') + ' Idea' : t('roadmap.newIdea')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Describe your idea briefly..."
              required
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.filter(c => c.value !== 'all').map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.value as Category })}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-2 ${
                    form.category === cat.value
                      ? 'border-transparent text-white ' + cat.color
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Provide more context about this idea..."
              required
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Image URL <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim() || !form.description.trim()}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium"
            >
              {saving ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : isEdit ? t('common.save') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
    return categories.find(cat => cat.value === category) || categories[1];
  };

  const handleCreate = async (data: IdeaFormData) => {
    await addRoadmapIdea({
      title: data.title,
      description: data.description,
      category: data.category,
      image_url: data.image_url || undefined,
    });
  };

  const handleUpdate = async (data: IdeaFormData) => {
    await updateRoadmapIdea(editingIdea.id, {
      title: data.title,
      description: data.description,
      category: data.category,
      image_url: data.image_url || undefined,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this idea?')) {
      deleteRoadmapIdea(id);
    }
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
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

        {filteredIdeas.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">
              {selectedCategory === 'all' ? t('roadmap.noIdeas') : `No ${getCategoryInfo(selectedCategory).label} ideas`}
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
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col"
                >
                  {idea.image_url && (
                    <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-t-xl overflow-hidden">
                      <img
                        src={idea.image_url}
                        alt={idea.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-2.5 py-1 text-xs rounded-full text-white font-medium ${categoryInfo.color}`}>
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
                          onClick={() => handleDelete(idea.id)}
                          className="w-8 h-8 bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full flex items-center justify-center transition-colors"
                          title="Delete idea"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-600 transition-colors" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                      {idea.title}
                    </h3>

                    <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-3 flex-1 text-sm leading-relaxed">
                      {idea.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: currentUser.color }}
                        >
                          {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{currentUser.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(idea.created_at || '').toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <IdeaModal
          initial={EMPTY_FORM}
          onSave={handleCreate}
          onClose={() => setShowCreateModal(false)}
          categories={categories}
          t={t}
        />
      )}

      {editingIdea && (
        <IdeaModal
          initial={{
            title: editingIdea.title,
            description: editingIdea.description,
            category: editingIdea.category,
            image_url: editingIdea.image_url || '',
          }}
          onSave={handleUpdate}
          onClose={() => setEditingIdea(null)}
          categories={categories}
          t={t}
        />
      )}
    </div>
  );
}
