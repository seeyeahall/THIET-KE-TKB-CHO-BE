-- Migration: 0004_rls_activities_auth.sql
-- Them policy de authenticated users co the tao/sua activities
-- Va them RPC function get_child_stats thay the /children/:id/stats endpoint

-- 1. Cho phep authenticated users them activities moi
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'activities_auth_insert' AND tablename = 'activities'
  ) THEN
    CREATE POLICY "activities_auth_insert"
      ON activities FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END;
$$;

-- 2. Cho phep authenticated users sua activities cua minh
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'activities_auth_update_own' AND tablename = 'activities'
  ) THEN
    CREATE POLICY "activities_auth_update_own"
      ON activities FOR UPDATE
      TO authenticated
      USING (created_by = auth.uid()::text OR created_by = 'user');
  END IF;
END;
$$;

-- 3. RPC Function: get_child_stats (thay the backend endpoint /children/:id/stats)
CREATE OR REPLACE FUNCTION public.get_child_stats(
  p_child_id uuid,
  p_period text DEFAULT 'week'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date timestamptz;
  v_completed int;
  v_total int;
  v_xp int;
  v_coins int;
BEGIN
  -- Tinh ngay bat dau theo period
  CASE p_period
    WHEN 'week' THEN v_start_date := date_trunc('week', now());
    WHEN 'month' THEN v_start_date := date_trunc('month', now());
    WHEN 'year' THEN v_start_date := date_trunc('year', now());
    ELSE v_start_date := date_trunc('week', now());
  END CASE;

  -- Dem hoat dong hoan thanh
  SELECT COUNT(*) INTO v_completed
  FROM schedule_items
  WHERE child_id = p_child_id
    AND status IN ('complete', 'completed')
    AND created_at >= v_start_date;

  -- Dem tong hoat dong
  SELECT COUNT(*) INTO v_total
  FROM schedule_items
  WHERE child_id = p_child_id
    AND created_at >= v_start_date;

  -- Lay XP va coins
  SELECT COALESCE(xp, 0), COALESCE(coins, 0)
  INTO v_xp, v_coins
  FROM rewards
  WHERE child_id = p_child_id;

  RETURN json_build_object(
    'completed_activities', v_completed,
    'total_activities', v_total,
    'xp', v_xp,
    'coins', v_coins,
    'period', p_period
  );
END;
$$;

-- Grant execute cho authenticated users
GRANT EXECUTE ON FUNCTION public.get_child_stats(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_child_stats(uuid, text) TO anon;
