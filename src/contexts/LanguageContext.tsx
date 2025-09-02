import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: 'en' | 'pt-BR';
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    'nav.personal': 'Personal',
    'nav.projects': 'Projects',
    'nav.devRoadmap': 'Dev Roadmap',
    'nav.logout': 'Logout',
    'nav.newProject': 'New Project',
    'nav.newIdea': 'New Idea',
    
    // Personal Dashboard
    'personal.title': 'Personal Dashboard',
    'personal.subtitle': 'Manage your private lists and tasks',
    'personal.createList': 'Create New List',
    'personal.addTask': 'Add Task',
    'personal.noTasks': 'No tasks yet',
    'personal.getStarted': 'Add a task to get started',
    'personal.completed': 'completed',
    'personal.strategy': 'Strategy',
    'personal.noStrategy': 'No strategy set',
    'personal.edit': 'Edit',
    'personal.save': 'Save',
    'personal.saveStrategy': 'Save Strategy',
    'personal.strategyPlaceholder': 'Enter focus areas for this list...',
    'personal.shared': 'SHARED',
    
    // Projects Dashboard
    'projects.title': 'Projects',
    'projects.subtitle': 'Collaborate with your team on shared projects',
    'projects.newProject': 'New Project',
    'projects.activeProjects': 'Active Projects',
    'projects.completedTasks': 'Completed Tasks',
    'projects.pendingTasks': 'Pending Tasks',
    'projects.highPriority': 'High Priority',
    'projects.noProjects': 'No Projects Yet',
    'projects.noProjectsDesc': 'Create your first project to start collaborating with your team',
    'projects.createProject': 'Create Project',
    'projects.members': 'members',
    
    // Dev Roadmap
    'roadmap.title': 'Dev Roadmap',
    'roadmap.subtitle': 'Collaborate on ideas for future development',
    'roadmap.newIdea': 'New Idea',
    'roadmap.allIdeas': 'All Ideas',
    'roadmap.newFeature': 'New Feature',
    'roadmap.improvement': 'Improvement',
    'roadmap.nextSteps': 'Next Steps',
    'roadmap.bug': 'Bug Fix',
    'roadmap.noIdeas': 'No Ideas Yet',
    'roadmap.noIdeasDesc': 'Share your ideas to help improve the app',
    'roadmap.addFirstIdea': 'Add First Idea',
    
    // Common
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.create': 'Create',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Task Management
    'task.addTask': 'Add Task',
    'task.taskTitle': 'Task title...',
    'task.lowPriority': 'Low Priority',
    'task.mediumPriority': 'Medium Priority',
    'task.highPriority': 'High Priority',
    'task.unassigned': 'Unassigned',
    'task.assign': 'Assign',
    'task.low': 'low',
    'task.medium': 'medium',
    'task.high': 'high',
    
    // Login
    'login.title': 'Team Kanban',
    'login.subtitle': 'Sign in to access your dashboard',
    'login.email': 'Email Address',
    'login.emailPlaceholder': 'Enter your email',
    'login.name': 'Full Name',
    'login.namePlaceholder': 'Enter your name',
    'login.signIn': 'Sign In',
    'login.quickLogin': 'Quick login as demo user:',
  },
  'pt-BR': {
    // Navigation
    'nav.personal': 'Pessoal',
    'nav.projects': 'Projetos',
    'nav.devRoadmap': 'Roadmap Dev',
    'nav.logout': 'Sair',
    'nav.newProject': 'Novo Projeto',
    'nav.newIdea': 'Nova Ideia',
    
    // Personal Dashboard
    'personal.title': 'Painel Pessoal',
    'personal.subtitle': 'Gerencie suas listas e tarefas privadas',
    'personal.createList': 'Criar Nova Lista',
    'personal.addTask': 'Adicionar Tarefa',
    'personal.noTasks': 'Nenhuma tarefa ainda',
    'personal.getStarted': 'Adicione uma tarefa para começar',
    'personal.completed': 'concluídas',
    'personal.strategy': 'Estratégia',
    'personal.noStrategy': 'Nenhuma estratégia definida',
    'personal.edit': 'Editar',
    'personal.save': 'Salvar',
    'personal.saveStrategy': 'Salvar Estratégia',
    'personal.strategyPlaceholder': 'Digite as áreas de foco para esta lista...',
    'personal.shared': 'COMPARTILHADO',
    
    // Projects Dashboard
    'projects.title': 'Projetos',
    'projects.subtitle': 'Colabore com sua equipe em projetos compartilhados',
    'projects.newProject': 'Novo Projeto',
    'projects.activeProjects': 'Projetos Ativos',
    'projects.completedTasks': 'Tarefas Concluídas',
    'projects.pendingTasks': 'Tarefas Pendentes',
    'projects.highPriority': 'Alta Prioridade',
    'projects.noProjects': 'Nenhum Projeto Ainda',
    'projects.noProjectsDesc': 'Crie seu primeiro projeto para começar a colaborar com sua equipe',
    'projects.createProject': 'Criar Projeto',
    'projects.members': 'membros',
    
    // Dev Roadmap
    'roadmap.title': 'Roadmap de Desenvolvimento',
    'roadmap.subtitle': 'Colabore em ideias para desenvolvimento futuro',
    'roadmap.newIdea': 'Nova Ideia',
    'roadmap.allIdeas': 'Todas as Ideias',
    'roadmap.newFeature': 'Nova Funcionalidade',
    'roadmap.improvement': 'Melhoria',
    'roadmap.nextSteps': 'Próximos Passos',
    'roadmap.bug': 'Correção de Bug',
    'roadmap.noIdeas': 'Nenhuma Ideia Ainda',
    'roadmap.noIdeasDesc': 'Compartilhe suas ideias para ajudar a melhorar o app',
    'roadmap.addFirstIdea': 'Adicionar Primeira Ideia',
    
    // Common
    'common.cancel': 'Cancelar',
    'common.save': 'Salvar',
    'common.create': 'Criar',
    'common.edit': 'Editar',
    'common.delete': 'Excluir',
    'common.confirm': 'Confirmar',
    'common.back': 'Voltar',
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    
    // Task Management
    'task.addTask': 'Adicionar Tarefa',
    'task.taskTitle': 'Título da tarefa...',
    'task.lowPriority': 'Prioridade Baixa',
    'task.mediumPriority': 'Prioridade Média',
    'task.highPriority': 'Prioridade Alta',
    'task.unassigned': 'Não Atribuído',
    'task.assign': 'Atribuir',
    'task.low': 'baixa',
    'task.medium': 'média',
    'task.high': 'alta',
    
    // Login
    'login.title': 'Kanban da Equipe',
    'login.subtitle': 'Faça login para acessar seu painel',
    'login.email': 'Endereço de Email',
    'login.emailPlaceholder': 'Digite seu email',
    'login.name': 'Nome Completo',
    'login.namePlaceholder': 'Digite seu nome',
    'login.signIn': 'Entrar',
    'login.quickLogin': 'Login rápido como usuário demo:',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<'en' | 'pt-BR'>(() => {
    const saved = localStorage.getItem('language');
    return (saved as 'en' | 'pt-BR') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'pt-BR' : 'en');
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}