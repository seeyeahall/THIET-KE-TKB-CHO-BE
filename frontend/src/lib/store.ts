import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Child, Activity, Schedule } from './types';

export type ScheduleViewMode = 'year' | 'month' | 'week' | 'day';

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

  // Schedule view state
  scheduleViewMode: ScheduleViewMode;
  setScheduleViewMode: (mode: ScheduleViewMode) => void;
  selectedDate: string;            // 'YYYY-MM-DD'
  setSelectedDate: (date: string) => void;
  selectedMonth: string;           // 'YYYY-MM'
  setSelectedMonth: (month: string) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  designMode: boolean;             // DayDesignModal đang mở
  setDesignMode: (open: boolean) => void;

  // UI
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMonthStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      authToken: null,
      setAuthToken: (token) => {
        // Luu token vao localStorage de api.ts co the doc
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

      // Schedule view state
      scheduleViewMode: 'month',
      setScheduleViewMode: (mode) => set({ scheduleViewMode: mode }),
      selectedDate: getTodayStr(),
      setSelectedDate: (date) => set({ selectedDate: date }),
      selectedMonth: getMonthStr(),
      setSelectedMonth: (month) => set({ selectedMonth: month }),
      selectedYear: new Date().getFullYear(),
      setSelectedYear: (year) => set({ selectedYear: year }),
      designMode: false,
      setDesignMode: (open) => set({ designMode: open }),

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
        scheduleViewMode: state.scheduleViewMode,
        selectedDate: state.selectedDate,
        selectedMonth: state.selectedMonth,
        selectedYear: state.selectedYear,
      }),
    }
  )
);
