import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

const GEMINI_MODEL = 'gemini-1.5-flash';

// Rule-based fallback khi khong co AI provider
function fallbackReply(name: string, message: string): string {
  const lower = message.toLowerCase();
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
}

async function callGemini(apiKey: string, messages: Array<{role: string, content: string}>): Promise<string | null> {
  // Convert to Gemini format
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find(m => m.role === 'system');

  const payload: Record<string, unknown> = { contents };
  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction.content }] };
  }
  payload.generationConfig = { maxOutputTokens: 512, temperature: 0.8 };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    // Auth: lay JWT tu header
    const authHeader = req.headers.get('Authorization');
    const clientGeminiKey = req.headers.get('x-gemini-api-key');

    // Tao Supabase client voi service role de bypass RLS khi doc du lieu
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user JWT (bat buoc phai co auth)
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!).auth.getUser(token);
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const { child_id, message } = await req.json();
    if (!child_id || !message) {
      return errorResponse('child_id and message are required', 400);
    }

    // Lay thong tin child
    const { data: child } = await supabase
      .from('children')
      .select('id, name, age, interests, dislikes, parent_notes')
      .eq('id', child_id)
      .single();

    const childName = child?.name ?? 'bé';

    // Lay lich su chat gan day (6 tin nhan cuoi)
    const { data: history } = await supabase
      .from('chat_history')
      .select('role, message')
      .eq('child_id', child_id)
      .order('created_at', { ascending: false })
      .limit(6);

    const recentHistory = (history ?? []).reverse();

    // Xay dung system prompt
    const systemPrompt = `Bạn là Naruto Uzumaki — ninja bạn đồng hành thân thiện, vui vẻ và đầy năng lượng của ${childName} (${child?.age ?? 7} tuổi).
Sở thích của bé: ${JSON.stringify(child?.interests ?? [])}.
Không thích: ${JSON.stringify(child?.dislikes ?? [])}.
Luôn dùng ngôn ngữ vui nhộn, khích lệ, phù hợp trẻ em. Trả lời ngắn gọn 1-3 câu. Thỉnh thoảng dùng "Dattebayo!" và emoji 🍥⚡.
Tuyệt đối KHÔNG dùng ngôn ngữ bạo lực, tiêu cực.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...recentHistory.map((h: { role: string; message: string }) => ({ role: h.role, content: h.message })),
      { role: 'user', content: message },
    ];

    // Goi AI
    const effectiveKey = clientGeminiKey || geminiApiKey;
    let reply: string | null = null;
    let provider = 'fallback';

    if (effectiveKey) {
      reply = await callGemini(effectiveKey, messages);
      if (reply) provider = 'gemini';
    }

    if (!reply) {
      reply = fallbackReply(childName, message);
    }

    // Luu chat history (fire and forget)
    supabase.from('chat_history').insert([
      { child_id, role: 'user', message },
      { child_id, role: 'assistant', message: reply, metadata: { provider } },
    ]).then(() => {}).catch(() => {});

    return jsonResponse({ reply, provider });

  } catch (err) {
    console.error('ai-chat error:', err);
    return errorResponse('Internal server error', 500);
  }
});
