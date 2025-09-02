import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          color: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          color?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string;
          color: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          color: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          color?: string;
          updated_at?: string;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
        };
      };
      lists: {
        Row: {
          id: string;
          title: string;
          strategy: string;
          type: 'personal' | 'project';
          project_id: string | null;
          user_id: string;
          color: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          strategy?: string;
          type: 'personal' | 'project';
          project_id?: string | null;
          user_id: string;
          color?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          strategy?: string;
          type?: 'personal' | 'project';
          project_id?: string | null;
          user_id?: string;
          color?: string | null;
          position?: number;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          tag: string;
          title: string;
          description: string | null;
          priority: 'low' | 'medium' | 'high';
          completed: boolean;
          list_id: string;
          assigned_to: string | null;
          due_date: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tag: string;
          title: string;
          description?: string | null;
          priority?: 'low' | 'medium' | 'high';
          completed?: boolean;
          list_id: string;
          assigned_to?: string | null;
          due_date?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tag?: string;
          title?: string;
          description?: string | null;
          priority?: 'low' | 'medium' | 'high';
          completed?: boolean;
          list_id?: string;
          assigned_to?: string | null;
          due_date?: string | null;
          position?: number;
          updated_at?: string;
        };
      };
      roadmap_ideas: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: 'new-feature' | 'improvement' | 'next-steps' | 'bug';
          image_url: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: 'new-feature' | 'improvement' | 'next-steps' | 'bug';
          image_url?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: 'new-feature' | 'improvement' | 'next-steps' | 'bug';
          image_url?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}