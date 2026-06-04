/**
 * api.ts — Supabase-native API layer
 * Replaces Fly.io FastAPI backend with:
 *   - Supabase PostgREST for all CRUD
 *   - Supabase Edge Functions for AI logic
 * Forever free: no separate backend server needed.
 */
import { getSupabaseClient } from './supabase';
import type { Child, Activity, Schedule, ScheduleItem } from './types';

// ─── Auth helper ───────────────────────────────────────────────────────────────
async function getSession() {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ─── Gemini key helper ─────────────────────────────────────────────────────────
function getGeminiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('GEMINI_API_KEY');
}

// ─── Extra headers for Edge Functions ─────────────────────────────────────────
async function edgeFunctionHeaders(): Promise<Record<string, string>> {
  const session = await getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  const geminiKey = getGeminiKey();
  if (geminiKey) {
    headers['x-gemini-api-key'] = geminiKey;
  }
  return headers;
}

// ─── Edge Function caller ──────────────────────────────────────────────────────
async function callEdgeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const supabase = getSupabaseClient();
  const geminiKey = getGeminiKey();

  const { data, error } = await supabase.functions.invoke<T>(name, {
    body: body as Record<string, unknown>,
    headers: geminiKey ? { 'x-gemini-api-key': geminiKey } : undefined,
  });

  if (error) throw new Error(`Edge function ${name} error: ${error.message}`);
  return data as T;
}

// ─── API object ────────────────────────────────────────────────────────────────
export const api = {
  // ── Health (dung Supabase REST ping) ─────────────────────────────────────
  health: async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('activities').select('id').limit(1);
    return {
      status: error ? 'error' : 'ok',
      database: error ? 'error' : 'ok',
      service: 'Supabase',
    };
  },

  // ── Children ──────────────────────────────────────────────────────────────
  listChildren: async (): Promise<Child[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Child[];
  },

  getChild: async (id: string): Promise<Child> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data as Child;
  },

  getChildStats: async (id: string, period: 'week' | 'month' | 'year' = 'week') => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_child_stats', {
      p_child_id: id,
      p_period: period,
    });
    if (error) {
      // Fallback: tinh thu cong neu RPC chua co
      const { data: rewards } = await supabase
        .from('rewards')
        .select('xp, coins')
        .eq('child_id', id)
        .single();
      return {
        completed_activities: 0,
        total_activities: 0,
        xp: rewards?.xp ?? 0,
        coins: rewards?.coins ?? 0,
        period,
      };
    }
    return data as { completed_activities: number; total_activities: number; xp: number; coins: number; period: string };
  },

  createChild: async (childData: Partial<Child>): Promise<Child> => {
    const supabase = getSupabaseClient();
    const session = await getSession();

    // Lay hoac tao family
    let familyId: string | null = null;
    if (session?.user?.id) {
      const { data: family } = await supabase
        .from('families')
        .select('id')
        .eq('parent_user_id', session.user.id)
        .single();
      familyId = family?.id ?? null;

      if (!familyId) {
        const { data: newFamily } = await supabase
          .from('families')
          .insert({ parent_user_id: session.user.id, name: 'My Family' })
          .select('id')
          .single();
        familyId = newFamily?.id ?? null;
      }
    }

    const { data, error } = await supabase
      .from('children')
      .insert({ ...childData, family_id: familyId })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as Child;
  },

  // ── Activities ────────────────────────────────────────────────────────────
  listActivities: async (params?: { age?: number; theme?: string }): Promise<Activity[]> => {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('activities')
      .select('*')
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (params?.theme) query = query.eq('theme', params.theme);
    if (params?.age) {
      query = query
        .lte('min_age', params.age)
        .gte('max_age', params.age);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as Activity[];
  },

  getActivity: async (id: string): Promise<Activity> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data as Activity;
  },

  createActivity: async (activityData: Partial<Activity>): Promise<Activity> => {
    const supabase = getSupabaseClient();
    const slug = (activityData.title ?? 'activity')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 60) + '-' + Date.now().toString(36);

    const { data, error } = await supabase
      .from('activities')
      .insert({ ...activityData, slug, status: 'published', created_by: 'user' })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as Activity;
  },

  // ── Schedules ─────────────────────────────────────────────────────────────
  listSchedules: async (childId: string): Promise<Schedule[]> => {
    const supabase = getSupabaseClient();
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('child_id', childId)
      .is('deleted_at', null)
      .order('week_start_date', { ascending: false });

    if (error) throw new Error(error.message);
    if (!schedules || schedules.length === 0) return [];

    // Load items for each schedule
    const scheduleIds = schedules.map((s: { id: string }) => s.id);
    const { data: items } = await supabase
      .from('schedule_items')
      .select('*, activities(*)')
      .in('schedule_id', scheduleIds)
      .is('deleted_at', null)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    return schedules.map((s: Record<string, unknown>) => ({
      ...s,
      items: (items ?? []).filter((i: { schedule_id: string }) => i.schedule_id === s.id),
    })) as Schedule[];
  },

  listSchedulesByMonth: async (childId: string, month: string): Promise<Schedule[]> => {
    const supabase = getSupabaseClient();
    const monthStart = `${month}-01`;
    const [y, m] = month.split('-').map(Number);
    const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;

    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('child_id', childId)
      .gte('week_start_date', monthStart)
      .lt('week_start_date', nextMonth)
      .is('deleted_at', null);

    if (error) throw new Error(error.message);
    if (!schedules || schedules.length === 0) return [];

    const scheduleIds = schedules.map((s: { id: string }) => s.id);
    const { data: items } = await supabase
      .from('schedule_items')
      .select('*, activities(*)')
      .in('schedule_id', scheduleIds)
      .is('deleted_at', null);

    return schedules.map((s: Record<string, unknown>) => ({
      ...s,
      items: (items ?? []).filter((i: { schedule_id: string }) => i.schedule_id === s.id),
    })) as Schedule[];
  },

  getScheduleItemsByDate: async (childId: string, date: string): Promise<ScheduleItem[]> => {
    // date = 'YYYY-MM-DD', lay schedule cua tuan chua date do
    const d = new Date(date);
    const day = d.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + mondayOffset);
    const weekStart = monday.toISOString().substring(0, 10);

    const supabase = getSupabaseClient();
    const { data: schedule } = await supabase
      .from('schedules')
      .select('id')
      .eq('child_id', childId)
      .eq('week_start_date', weekStart)
      .single();

    if (!schedule) return [];

    const dow = (d.getDay() + 6) % 7; // 0=Mon...6=Sun
    const { data: items, error } = await supabase
      .from('schedule_items')
      .select('*, activities(*)')
      .eq('schedule_id', schedule.id)
      .eq('day_of_week', dow)
      .is('deleted_at', null)
      .order('start_time', { ascending: true });

    if (error) throw new Error(error.message);
    return (items ?? []) as ScheduleItem[];
  },

  getCurrentSchedule: async (childId: string, weekStart?: string): Promise<Schedule> => {
    const supabase = getSupabaseClient();
    let ws = weekStart;
    if (!ws) {
      const today = new Date();
      const day = today.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);
      ws = monday.toISOString().substring(0, 10);
    }

    const { data: schedule, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('child_id', childId)
      .eq('week_start_date', ws)
      .single();

    if (error) throw new Error(error.message);

    const { data: items } = await supabase
      .from('schedule_items')
      .select('*, activities(*)')
      .eq('schedule_id', schedule.id)
      .is('deleted_at', null)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    return { ...schedule, items: items ?? [] } as Schedule;
  },

  createSchedule: async (scheduleData: Partial<Schedule>): Promise<Schedule> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('schedules')
      .insert(scheduleData)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return { ...data, items: [] } as Schedule;
  },

  addScheduleItem: async (scheduleId: string, itemData: Partial<ScheduleItem> & { sort_order?: number }): Promise<ScheduleItem> => {
    const supabase = getSupabaseClient();
    // Lay child_id tu schedule
    const { data: schedule } = await supabase
      .from('schedules')
      .select('child_id')
      .eq('id', scheduleId)
      .single();

    const { data, error } = await supabase
      .from('schedule_items')
      .insert({ ...itemData, schedule_id: scheduleId, child_id: schedule?.child_id })
      .select('*, activities(*)')
      .single();
    if (error) throw new Error(error.message);
    return data as ScheduleItem;
  },

  updateScheduleItem: async (itemId: string, status: string, notes?: string): Promise<ScheduleItem> => {
    const supabase = getSupabaseClient();
    const updateData: Record<string, unknown> = { status };
    if (notes !== undefined) updateData.notes = notes;
    if (status === 'complete' || status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('schedule_items')
      .update(updateData)
      .eq('id', itemId)
      .select('*, activities(*)')
      .single();
    if (error) throw new Error(error.message);
    return data as ScheduleItem;
  },

  moveScheduleItem: async (itemId: string, dayOfWeek: number, startTime: string): Promise<ScheduleItem> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('schedule_items')
      .update({ day_of_week: dayOfWeek, start_time: startTime })
      .eq('id', itemId)
      .select('*, activities(*)')
      .single();
    if (error) throw new Error(error.message);
    return data as ScheduleItem;
  },

  // ── AI (Edge Functions) ───────────────────────────────────────────────────
  sendChat: async (childId: string, message: string) => {
    return callEdgeFunction<{ reply: string; provider: string }>('ai-chat', { child_id: childId, message });
  },

  getChatHistory: async (childId: string, limit = 20) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('chat_history')
      .select('id, role, message, created_at')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return ((data ?? []).reverse()) as Array<{ id: string; role: 'user' | 'assistant'; message: string; created_at: string }>;
  },

  generateSchedule: async (childId: string, weekStartDate: string, theme?: string) => {
    return callEdgeFunction<{
      schedule: {
        title?: string;
        theme?: string;
        items: Array<{
          day_of_week: number;
          start_time: string;
          duration_minutes: number;
          activity_title: string;
          activity_theme: string;
          notes?: string;
        }>;
      };
      provider: string;
    }>('ai-generate-schedule', { child_id: childId, week_start_date: weekStartDate, theme });
  },

  generateImage: async (_activityId: string, prompt?: string) => {
    // Client-side Pollinations.ai (hoan toan mien phi, khong can key)
    const safePrompt = encodeURIComponent(
      prompt ?? 'A cute watercolor illustration of a Vietnamese child doing a fun activity. Bright colors, playful, children book style.'
    );
    const imageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=400&height=300&nologo=true&seed=${Date.now()}`;
    return { image_url: imageUrl, activity_id: _activityId };
  },

  // ── Rewards (Edge Function) ───────────────────────────────────────────────
  completeActivity: async (childId: string, scheduleItemId: string) => {
    return callEdgeFunction<{ status: string; xp_earned: number; coins_earned: number }>('complete-activity', {
      child_id: childId,
      schedule_item_id: scheduleItemId,
    });
  },

  // ── Media (Supabase Storage truc tiep) ───────────────────────────────────
  signUpload: async (uploadData: { asset_type: string; child_id?: string; filename: string; content_type: string }) => {
    const supabase = getSupabaseClient();
    const bucket = uploadData.asset_type === 'avatar' ? 'avatars' : 'media';
    const path = `${uploadData.child_id ?? 'shared'}/${Date.now()}-${uploadData.filename}`;
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return {
      signed_url: data.signedUrl,
      token: data.token,
      bucket,
      path,
      public_url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl,
    };
  },

  confirmUpload: async (_data: unknown) => ({ status: 'ok', asset: null }),
  listAssets: async () => [] as unknown[],
  listProviders: async () => [],
};

// Re-export types
export type { Child, Activity, Schedule, ScheduleItem, ChatMessage, AIProvider } from './types';
