import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: any;
  isAdmin: boolean;
  setUser: (user: any) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  setUser: (user) => set({ 
    user, 
    isAdmin: user?.email?.toLowerCase() === 'admin@admin.com'
  }),
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    const isAdmin = data.user?.email?.toLowerCase() === 'admin@admin.com';
    set({ user: data.user, isAdmin });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAdmin: false });
  },
  checkSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const isAdmin = session.user.email?.toLowerCase() === 'admin@admin.com';
      set({ user: session.user, isAdmin });
    }
  },
}));