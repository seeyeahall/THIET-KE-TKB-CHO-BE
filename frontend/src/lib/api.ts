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

  // ── AI (Client-side Gemini) ───────────────────────────────────────────────
  sendChat: async (childId: string, message: string): Promise<{ reply: string; provider: string }> => {
    const supabase = getSupabaseClient();
    const geminiKey = getGeminiKey();

    // 1. Get child info
    const { data: child } = await supabase
      .from('children')
      .select('id, name, age, interests, dislikes, parent_notes')
      .eq('id', childId)
      .single();

    const childName = child?.name ?? 'bé';

    // 2. Get chat history (last 6 messages)
    const { data: history } = await supabase
      .from('chat_history')
      .select('role, message')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(6);

    const recentHistory = (history ?? []).reverse();

    // 3. Fallback reply function (Uzumaki Naruto)
    const fallbackReply = (name: string, msg: string): string => {
      const lower = msg.toLowerCase();
      if (['chào', 'hello', 'hi', 'hey', 'xin chào'].some(w => lower.includes(w)))
        return `Dattebayo! 🍥 Chào ${name}! Mình là Naruto — ninja bạn đồng hành của bạn! Hôm nay chúng ta phiêu lưu gì nào? ⚡`;
      if (['tạm biệt', 'bye', 'bai'].some(w => lower.includes(w)))
        return `Tạm biệt ${name}! Chúc bạn một ngày vui vẻ và đầy phiêu lưu nhé! Hẹn gặp lại! ⚡`;
      if (['cảm ơn', 'thank', 'cam on'].some(w => lower.includes(w)))
        return `Không có gì đâu ${name}! Ninja tụi mình luôn sẵn sàng giúp bạn bè mà. Dattebayo! 🍥`;
      if (['buồn', 'sad', 'khóc', 'mệt'].some(w => lower.includes(w)))
        return `${name} ơi, đừng buồn nha! Hít thật sâu và mỉm cười đi. Bạn muốn mình kể chuyện vui không? ⚡`;
      if (['vui', 'happy', 'thích', 'thú vị'].some(w => lower.includes(w)))
        return `Tuyệt vời quá ${name}! Mình cũng vui lây rồi đó! Hôm nay bạn làm gì vui vậy? 🍥`;
      if (['lịch', 'hoạt động', 'hôm nay'].some(w => lower.includes(w)))
        return `${name} muốn lên lịch phiêu lưu hả! Hãy vào trang Lịch Biểu để tạo kế hoạch cho tuần này nhé! 📅 Dattebayo!`;
      return `${name} nói chuyện thật thú vị! Mình rất thích trò chuyện với bạn. Bạn có câu hỏi gì nữa không? 🍥`;
    };

    let reply: string | null = null;
    let provider = 'fallback';

    if (geminiKey) {
      try {
        const systemPrompt = `Bạn là Naruto Uzumaki — ninja bạn đồng hành thân thiện, vui vẻ và đầy năng lượng của ${childName} (${child?.age ?? 7} tuổi).
Sở thích của bé: ${JSON.stringify(child?.interests ?? [])}.
Không thích: ${JSON.stringify(child?.dislikes ?? [])}.
Luôn dùng ngôn ngữ vui nhộn, khích lệ, phù hợp trẻ em. Trả lời ngắn gọn 1-3 câu. Thỉnh thoảng dùng "Dattebayo!" và emoji 🍥⚡.
Tuyệt đối KHÔNG dùng ngôn ngữ bạo lực, tiêu cực.`;

        const contents = [
          ...recentHistory.map((h: { role: string; message: string }) => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.message }],
          })),
          { role: 'user', parts: [{ text: message }] }
        ];

        const payload = {
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { maxOutputTokens: 512, temperature: 0.8 }
        };

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (resp.ok) {
          const data = await resp.json();
          reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
          if (reply) provider = 'gemini';
        }
      } catch (err) {
        console.error('Client-side Gemini chat error:', err);
      }
    }

    if (!reply) {
      reply = fallbackReply(childName, message);
    }

    // Save chat history
    try {
      await supabase.from('chat_history').insert([
        { child_id: childId, role: 'user', message },
        { child_id: childId, role: 'assistant', message: reply, metadata: { provider } },
      ]);
    } catch (dbErr) {
      console.error('Failed to save chat history:', dbErr);
    }

    return { reply, provider };
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
    const supabase = getSupabaseClient();
    const geminiKey = getGeminiKey();

    // 1. Get child info
    const { data: child } = await supabase
      .from('children')
      .select('id, name, age, interests, dislikes, parent_notes')
      .eq('id', childId)
      .single();

    const childName = child?.name ?? 'bé';

    // 2. Get recent schedule items to avoid repetition
    const { data: recentItems } = await supabase
      .from('schedule_items')
      .select('activity_id, activities(title, theme)')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentTitles = (recentItems ?? [])
      .map((i: any) => i.activities?.title)
      .filter(Boolean);

    // 3. Fallback schedule builder
    const makeFallbackSchedule = (cName: string, th: string) => {
      return {
        title: `Lịch tuần của ${cName}`,
        theme: th || 'Khám phá thiên nhiên',
        items: [
          { day_of_week: 0, start_time: '09:00', duration_minutes: 30, activity_title: 'Vẽ tranh buổi sáng', activity_theme: 'Nghệ thuật', notes: 'Vẽ tự do' },
          { day_of_week: 0, start_time: '14:00', duration_minutes: 20, activity_title: 'Đọc sách', activity_theme: 'Học tập', notes: 'Sách yêu thích' },
          { day_of_week: 1, start_time: '09:30', duration_minutes: 25, activity_title: 'Trồng cây nhỏ', activity_theme: 'Thiên nhiên', notes: 'Theo dõi cây lớn lên' },
          { day_of_week: 2, start_time: '10:00', duration_minutes: 30, activity_title: 'Chạy ngoài sân', activity_theme: 'Vận động', notes: 'Chơi ngoài trời 30 phút' },
          { day_of_week: 3, start_time: '09:00', duration_minutes: 20, activity_title: 'Thí nghiệm nước', activity_theme: 'Học tập', notes: 'Quan sát sự vật thay đổi' },
          { day_of_week: 4, start_time: '14:30', duration_minutes: 30, activity_title: 'Vẽ tranh gia đình', activity_theme: 'Nghệ thuật', notes: 'Chân dung cả nhà' },
        ],
      };
    };

    let schedule = null;
    let provider = 'fallback';

    if (geminiKey) {
      try {
        const systemPrompt = `Bạn là AI lên kế hoạch hoạt động cho trẻ em người Việt. Tạo lịch tuần phù hợp lứa tuổi, vui nhộn, cân bằng. Luôn trả về JSON hợp lệ theo schema yêu cầu.`;

        const userPrompt = `Tạo lịch tuần bắt đầu từ ${weekStartDate} cho bé ${childName} (${child?.age ?? 7} tuổi).
Chủ đề: ${theme || 'Tự chọn phù hợp'}.
Sở thích: ${JSON.stringify(child?.interests ?? [])}.
Không thích: ${JSON.stringify(child?.dislikes ?? [])}.
Gần đây đã làm: ${recentTitles.join(', ') || 'chưa có'}.
Ghi chú phụ huynh: ${child?.parent_notes ?? 'không có'}.

Yêu cầu: mỗi ngày 3-5 hoạt động, cân bằng học tập/vận động/nghệ thuật/thiên nhiên, thời gian hợp lý 15-45 phút mỗi hoạt động.
day_of_week: 0=Thứ 2, 1=Thứ 3, 2=Thứ 4, 3=Thứ 5, 4=Thứ 6, 5=Thứ 7, 6=Chủ Nhật.

Trả về JSON đúng schema:
{
  "title": "string",
  "theme": "string", 
  "items": [
    {
      "day_of_week": 0-6,
      "start_time": "HH:MM",
      "duration_minutes": 15-60,
      "activity_title": "string",
      "activity_theme": "Học tập|Vận động|Nghệ thuật|Thiên nhiên|Tự chọn",
      "notes": "string"
    }
  ]
}`;

        const payload = {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 2048,
            temperature: 0.7,
          },
        };

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (resp.ok) {
          const data = await resp.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          schedule = JSON.parse(cleaned);
          provider = 'gemini';
        }
      } catch (err) {
        console.error('Client-side Gemini schedule error:', err);
      }
    }

    if (!schedule) {
      schedule = makeFallbackSchedule(childName, theme || '');
    }

    return { schedule, provider };
  },

  generateImage: async (_activityId: string, prompt?: string) => {
    // Client-side Pollinations.ai (hoan toan mien phi, khong can key)
    const safePrompt = encodeURIComponent(
      prompt ?? 'A cute watercolor illustration of a Vietnamese child doing a fun activity. Bright colors, playful, children book style.'
    );
    const imageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=400&height=300&nologo=true&seed=${Date.now()}`;
    return { image_url: imageUrl, activity_id: _activityId };
  },

  // ── Rewards (Client-side) ──────────────────────────────────────────────────
  completeActivity: async (childId: string, scheduleItemId: string) => {
    const supabase = getSupabaseClient();
    const XP_PER_ACTIVITY = 15;
    const COINS_PER_ACTIVITY = 5;

    // 1. Get activity info from schedule item
    const { data: item, error: itemError } = await supabase
      .from('schedule_items')
      .update({ status: 'complete', completed_at: new Date().toISOString() })
      .eq('id', scheduleItemId)
      .eq('child_id', childId)
      .select('id, activity_id')
      .single();

    if (itemError || !item) {
      throw new Error('Schedule item not found or already completed');
    }

    // 2. Insert into activity_history
    try {
      await supabase.from('activity_history').insert({
        child_id: childId,
        activity_id: item.activity_id,
        schedule_item_id: scheduleItemId,
        status: 'complete',
      });
    } catch (historyErr) {
      console.error('Failed to log activity history:', historyErr);
    }

    // 3. Upsert rewards
    let newXp = XP_PER_ACTIVITY;
    let newCoins = COINS_PER_ACTIVITY;

    try {
      const { data: existingReward } = await supabase
        .from('rewards')
        .select('xp, coins')
        .eq('child_id', childId)
        .single();

      newXp = (existingReward?.xp ?? 0) + XP_PER_ACTIVITY;
      newCoins = (existingReward?.coins ?? 0) + COINS_PER_ACTIVITY;

      await supabase.from('rewards').upsert(
        { child_id: childId, xp: newXp, coins: newCoins, updated_at: new Date().toISOString() },
        { onConflict: 'child_id' }
      );
    } catch (rewardsErr) {
      console.error('Failed to update rewards:', rewardsErr);
    }

    return {
      status: 'completed',
      xp_earned: XP_PER_ACTIVITY,
      coins_earned: COINS_PER_ACTIVITY,
      total_xp: newXp,
      total_coins: newCoins,
    };
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
