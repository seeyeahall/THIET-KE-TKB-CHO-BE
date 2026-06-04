import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

const XP_PER_ACTIVITY = 15;
const COINS_PER_ACTIVITY = 5;

Deno.serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('Missing authorization header', 401);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await createClient(
      supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!
    ).auth.getUser(token);
    if (authError || !user) return errorResponse('Unauthorized', 401);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { child_id, schedule_item_id } = await req.json();

    if (!child_id || !schedule_item_id) {
      return errorResponse('child_id and schedule_item_id are required', 400);
    }

    // 1. Cap nhat trang thai schedule item
    const { data: item, error: itemError } = await supabase
      .from('schedule_items')
      .update({ status: 'complete', completed_at: new Date().toISOString() })
      .eq('id', schedule_item_id)
      .eq('child_id', child_id)
      .select('id, activity_id')
      .single();

    if (itemError || !item) {
      return errorResponse('Schedule item not found or already completed', 404);
    }

    // 2. Tao activity history
    await supabase.from('activity_history').insert({
      child_id,
      activity_id: item.activity_id,
      schedule_item_id,
      status: 'complete',
    });

    // 3. Upsert rewards (XP + coins)
    const { data: existingReward } = await supabase
      .from('rewards')
      .select('xp, coins')
      .eq('child_id', child_id)
      .single();

    const newXp = (existingReward?.xp ?? 0) + XP_PER_ACTIVITY;
    const newCoins = (existingReward?.coins ?? 0) + COINS_PER_ACTIVITY;

    await supabase.from('rewards').upsert(
      { child_id, xp: newXp, coins: newCoins, updated_at: new Date().toISOString() },
      { onConflict: 'child_id' }
    );

    return jsonResponse({
      status: 'completed',
      xp_earned: XP_PER_ACTIVITY,
      coins_earned: COINS_PER_ACTIVITY,
      total_xp: newXp,
      total_coins: newCoins,
    });

  } catch (err) {
    console.error('complete-activity error:', err);
    return errorResponse('Internal server error', 500);
  }
});
