import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

type AuthState = {
  session: Session | null;
  user: User | null;
  isGuest: boolean;
  loading: boolean;
  authMessage: string | null;
  setSession: (session: Session | null) => void;
  enterGuest: () => void;
  clearGuest: () => void;
  setLoading: (loading: boolean) => void;
  setAuthMessage: (message: string | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isGuest: false,
  loading: true,
  authMessage: null,
  setSession: (session) => set((state) => ({ session, user: session?.user ?? null, isGuest: session ? false : state.isGuest, loading: false })),
  enterGuest: () => set({ session: null, user: null, isGuest: true, loading: false }),
  clearGuest: () => set({ isGuest: false }),
  setLoading: (loading) => set({ loading }),
  setAuthMessage: (authMessage) => set({ authMessage }),
}));
