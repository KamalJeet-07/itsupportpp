// store/authStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: any;
  isAdmin: boolean;
  isLoading: boolean;
  setUser: (user: any) => void;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  isLoading: true, // Initialize as loading

  setUser: (user) =>
    set({
      user,
      isAdmin: user?.email?.toLowerCase() === 'admin@admin.com',
    }),

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      const isAdmin = data.user?.email?.toLowerCase() === 'admin@admin.com';
      set({ user: data.user, isAdmin, isLoading: false });
      return isAdmin;
    } catch (error) {
      console.error('Sign-in error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null, isAdmin: false, isLoading: false });
    } catch (error) {
      console.error('Sign-out error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        const isAdmin = session.user.email?.toLowerCase() === 'admin@admin.com';
        set({ user: session.user, isAdmin, isLoading: false });
      } else {
        set({ user: null, isAdmin: false, isLoading: false });
      }
    } catch (error) {
      console.error('Session check error:', error);
      set({ user: null, isAdmin: false, isLoading: false });
    }
  },
}));
