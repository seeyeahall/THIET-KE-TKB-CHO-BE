import type { Child, Activity, Schedule, ScheduleItem, AIProvider } from './types';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('BACKEND_API_URL');
    if (saved) return saved.replace(/\/$/, '');
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8001';
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  let geminiKey = null;
  if (typeof window !== 'undefined') {
    geminiKey = localStorage.getItem('GEMINI_API_KEY');
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(geminiKey ? { 'X-Gemini-Api-Key': geminiKey } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };

  const apiBase = getApiBaseUrl();
  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`API ${res.status}: ${err}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Health
  health: () => fetchJson<{ status: string; database: string }>('/health'),

  // Children
  listChildren: () => fetchJson<Child[]>('/api/v1/children'),
  getChild: (id: string) => fetchJson<Child>(`/api/v1/children/${id}`),
  getChildStats: (id: string) => fetchJson<{ completed_activities: number; total_activities: number; xp: number; coins: number }>(`/api/v1/children/${id}/stats`),
  createChild: (data: Partial<Child>) =>
    fetchJson<Child>('/api/v1/children', { method: 'POST', body: JSON.stringify(data) }),

  // Activities
  listActivities: (params?: { age?: number; theme?: string }) => {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]).toString() : '';
    return fetchJson<Activity[]>(`/api/v1/activities${qs}`);
  },
  getActivity: (id: string) => fetchJson<Activity>(`/api/v1/activities/${id}`),
  createActivity: (data: Partial<Activity>) =>
    fetchJson<Activity>('/api/v1/activities', { method: 'POST', body: JSON.stringify(data) }),

  // Schedules
  listSchedules: (childId: string) =>
    fetchJson<Schedule[]>(`/api/v1/schedules?child_id=${childId}`),
  getCurrentSchedule: (childId: string, weekStart?: string) => {
    const qs = new URLSearchParams({ child_id: childId });
    if (weekStart) qs.append('week_start', weekStart);
    return fetchJson<Schedule>(`/api/v1/schedules/current?${qs.toString()}`);
  },
  createSchedule: (data: Partial<Schedule>) =>
    fetchJson<Schedule>('/api/v1/schedules', { method: 'POST', body: JSON.stringify(data) }),
  addScheduleItem: (scheduleId: string, data: any) =>
    fetchJson<ScheduleItem>(`/api/v1/schedules/${scheduleId}/items`, { method: 'POST', body: JSON.stringify(data) }),
  updateScheduleItem: (itemId: string, status: string, notes?: string) =>
    fetchJson<ScheduleItem>(`/api/v1/schedule-items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  // Media
  signUpload: (data: { asset_type: string; child_id?: string; filename: string; content_type: string }) =>
    fetchJson<{ signed_url: string; token: string; bucket: string; path: string; public_url: string }>('/api/v1/media/sign-upload', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  confirmUpload: (data: { bucket: string; path: string; asset_type: string; child_id?: string; public_url?: string }) =>
    fetchJson<{ status: string; asset: unknown }>('/api/v1/media/confirm-upload', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listAssets: (params?: { asset_type?: string; child_id?: string }) => {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]).toString() : '';
    return fetchJson<Array<unknown>>(`/api/v1/media/assets${qs}`);
  },

  // AI
  listProviders: () => fetchJson<AIProvider[]>('/api/v1/ai/providers'),
  chat: (childId: string, message: string) =>
    fetchJson<{ reply: string; provider: string }>('/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ child_id: childId, message }),
    }),
  sendChat: (childId: string, message: string) =>
    fetchJson<{ reply: string; provider: string }>('/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ child_id: childId, message }),
    }),
  generateSchedule: (childId: string, weekStartDate: string, theme?: string) =>
    fetchJson<{ schedule: { items: Array<{ day_of_week: number; start_time: string; duration_minutes: number; activity_title: string; activity_theme: string; notes?: string }> } }>('/api/v1/ai/generate-schedule', {
      method: 'POST',
      body: JSON.stringify({ child_id: childId, week_start_date: weekStartDate, theme }),
    }),
  generateImage: (activityId: string, prompt?: string) =>
    fetchJson<{ image_url: string; activity_id: string }>('/api/v1/ai/generate-image', {
      method: 'POST',
      body: JSON.stringify({ activity_id: activityId, prompt }),
    }),

  // Rewards
  completeActivity: (childId: string, scheduleItemId: string) =>
    fetchJson<{ status: string; xp_earned: number; coins_earned: number }>('/api/v1/rewards/complete-activity', {
      method: 'POST',
      body: JSON.stringify({ child_id: childId, schedule_item_id: scheduleItemId }),
    }),
};

// Re-export types for convenience
export type { Child, Activity, Schedule, ScheduleItem, ChatMessage, AIProvider } from './types';
