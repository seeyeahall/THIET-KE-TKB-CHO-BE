import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Child, Activity, Schedule } from './types';

interface AppState {
  // Auth
  authToken: string | null;
  setAuthToken: (token: string | null) => void;

  // Selected child
  selectedChild: Child | null;
  setSelectedChild: (child: Child | null) => void;

  // Data cache
  children: Child[];
  setChildren: (children: Child[]) => void;
  activities: Activity[];
  setActivities: (activities: Activity[]) => void;
  currentSchedule: Schedule | null;
  setCurrentSchedule: (schedule: Schedule | null) => void;

  // UI
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      authToken: null,
      setAuthToken: (token) => {
        if (token) localStorage.setItem('auth_token', token);
        else localStorage.removeItem('auth_token');
        set({ authToken: token });
      },

      selectedChild: null,
      setSelectedChild: (child) => set({ selectedChild: child }),

      children: [],
      setChildren: (children) => set({ children }),
      activities: [],
      setActivities: (activities) => set({ activities }),
      currentSchedule: null,
      setCurrentSchedule: (schedule) => set({ currentSchedule: schedule }),

      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      error: null,
      setError: (error) => set({ error }),
    }),
    {
      name: 'kid-adventure-planner',
      partialize: (state) => ({
        authToken: state.authToken,
        selectedChild: state.selectedChild,
      }),
    }
  )
);
