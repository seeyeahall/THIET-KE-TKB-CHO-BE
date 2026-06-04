import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

const GEMINI_MODEL = 'gemini-1.5-flash';

async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string | null> {
  const payload = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 2048,
      temperature: 0.7,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    console.error('Gemini error:', resp.status, await resp.text());
    return null;
  }
  const data = await resp.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

// Fallback schedule khi khong co AI
function makeFallbackSchedule(childName: string, theme: string) {
  return {
    title: `Lịch tuần của ${childName}`,
    theme: theme || 'Khám phá thiên nhiên',
    items: [
      { day_of_week: 0, start_time: '09:00', duration_minutes: 30, activity_title: 'Vẽ tranh buổi sáng', activity_theme: 'Nghệ thuật', notes: 'Vẽ tự do' },
      { day_of_week: 0, start_time: '14:00', duration_minutes: 20, activity_title: 'Đọc sách', activity_theme: 'Học tập', notes: 'Sách yêu thích' },
      { day_of_week: 1, start_time: '09:30', duration_minutes: 25, activity_title: 'Trồng cây nhỏ', activity_theme: 'Thiên nhiên', notes: 'Theo dõi cây lớn lên' },
      { day_of_week: 2, start_time: '10:00', duration_minutes: 30, activity_title: 'Chạy ngoài sân', activity_theme: 'Vận động', notes: 'Chơi ngoài trời 30 phút' },
      { day_of_week: 3, start_time: '09:00', duration_minutes: 20, activity_title: 'Thí nghiệm nước', activity_theme: 'Học tập', notes: 'Quan sát sự vật thay đổi' },
      { day_of_week: 4, start_time: '14:30', duration_minutes: 30, activity_title: 'Vẽ tranh gia đình', activity_theme: 'Nghệ thuật', notes: 'Chân dung cả nhà' },
    ],
  };
}

Deno.serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    const authHeader = req.headers.get('Authorization');
    const clientGeminiKey = req.headers.get('x-gemini-api-key');

    if (!authHeader) return errorResponse('Missing authorization header', 401);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await createClient(
      supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!
    ).auth.getUser(token);
    if (authError || !user) return errorResponse('Unauthorized', 401);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { child_id, week_start_date, theme } = await req.json();

    if (!child_id || !week_start_date) {
      return errorResponse('child_id and week_start_date are required', 400);
    }

    // Lay thong tin child
    const { data: child } = await supabase
      .from('children')
      .select('id, name, age, interests, dislikes, parent_notes')
      .eq('id', child_id)
      .single();

    const childName = child?.name ?? 'bé';

    // Lay hoat dong gan day
    const { data: recentItems } = await supabase
      .from('schedule_items')
      .select('activity_id, activities(title, theme)')
      .eq('child_id', child_id)
      .order('created_at', { ascending: false })
      .limit(5);

    const systemPrompt = `Bạn là AI lên kế hoạch hoạt động cho trẻ em người Việt. Tạo lịch tuần phù hợp lứa tuổi, vui nhộn, cân bằng. Luôn trả về JSON hợp lệ theo schema yêu cầu.`;

    const recentTitles = (recentItems ?? []).map((i: { activities?: { title?: string } }) => i.activities?.title).filter(Boolean);
    const userPrompt = `Tạo lịch tuần bắt đầu từ ${week_start_date} cho bé ${childName} (${child?.age ?? 7} tuổi).
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

    const effectiveKey = clientGeminiKey || geminiApiKey;
    let schedule = null;

    if (effectiveKey) {
      const raw = await callGemini(effectiveKey, systemPrompt, userPrompt);
      if (raw) {
        try {
          // Strip markdown code fences if present
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          schedule = JSON.parse(cleaned);
        } catch {
          console.error('Failed to parse Gemini JSON:', raw);
        }
      }
    }

    if (!schedule) {
      schedule = makeFallbackSchedule(childName, theme);
    }

    return jsonResponse({ schedule, provider: schedule === makeFallbackSchedule(childName, theme) ? 'fallback' : 'gemini' });

  } catch (err) {
    console.error('ai-generate-schedule error:', err);
    return errorResponse('Internal server error', 500);
  }
});
