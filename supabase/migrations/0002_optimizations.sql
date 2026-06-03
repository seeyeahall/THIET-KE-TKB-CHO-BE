-- Kid Adventure Planner — Schema Optimizations
-- Run after 0001_initial.sql

-- ============================================
-- 1. Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION auto_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Add updated_at where missing
-- ============================================
ALTER TABLE children ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE activity_history ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE badges ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- families already has created_at only; add updated_at
ALTER TABLE families ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- rewards fix: ensure created_at exists
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ============================================
-- 3. Create updated_at triggers
-- ============================================
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'families', 'children', 'activities', 'schedules',
    'schedule_items', 'activity_history', 'chat_history',
    'badges', 'ai_providers', 'media_assets', 'rewards'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trg_' || t || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW
         EXECUTE FUNCTION auto_update_updated_at()',
        t, t
      );
    END IF;
  END LOOP;
END;
$$;

-- ============================================
-- 4. Soft delete (deleted_at)
-- ============================================
ALTER TABLE children ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ============================================
-- 5. CHECK constraints
-- ============================================
-- Children age realistic range (allow 1-17 for future expansion beyond MVP 6-10)
DO $$
BEGIN
  ALTER TABLE children
    ADD CONSTRAINT chk_children_age CHECK (age BETWEEN 1 AND 17);
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Constraint chk_children_age already exists';
END;
$$;

-- Schedule items day_of_week 0=Mon..6=Sun
DO $$
BEGIN
  ALTER TABLE schedule_items
    ADD CONSTRAINT chk_schedule_items_day CHECK (day_of_week BETWEEN 0 AND 6);
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Constraint chk_schedule_items_day already exists';
END;
$$;

-- Duration must be positive
DO $$
BEGIN
  ALTER TABLE activities
    ADD CONSTRAINT chk_activities_duration CHECK (duration_minutes > 0);
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Constraint chk_activities_duration already exists';
END;
$$;

DO $$
BEGIN
  ALTER TABLE schedule_items
    ADD CONSTRAINT chk_schedule_items_duration CHECK (duration_minutes > 0);
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Constraint chk_schedule_items_duration already exists';
END;
$$;

-- Activity status enum-ish
DO $$
BEGIN
  ALTER TABLE activities
    ADD CONSTRAINT chk_activities_status CHECK (status IN ('draft', 'published', 'archived'));
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Constraint chk_activities_status already exists';
END;
$$;

-- Schedule item status
DO $$
BEGIN
  ALTER TABLE schedule_items
    ADD CONSTRAINT chk_schedule_items_status CHECK (status IN ('planned', 'complete', 'skip', 'postponed'));
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Constraint chk_schedule_items_status already exists';
END;
$$;

-- Activity history status
DO $$
BEGIN
  ALTER TABLE activity_history
    ADD CONSTRAINT chk_activity_history_status CHECK (status IN ('complete', 'skip', 'abandoned', 'rescheduled'));
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Constraint chk_activity_history_status already exists';
END;
$$;

-- ============================================
-- 6. Composite & additional indexes
-- ============================================
-- Unique slug index explicit
CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_slug ON activities(slug) WHERE deleted_at IS NULL;

-- Schedules by child + week (most common query)
CREATE INDEX IF NOT EXISTS idx_schedules_child_week ON schedules(child_id, week_start_date) WHERE deleted_at IS NULL;

-- Schedule items by schedule + day + order
CREATE INDEX IF NOT EXISTS idx_schedule_items_schedule_day_order ON schedule_items(schedule_id, day_of_week, sort_order) WHERE deleted_at IS NULL;

-- Schedule items by child + status
CREATE INDEX IF NOT EXISTS idx_schedule_items_child_status ON schedule_items(child_id, status) WHERE deleted_at IS NULL;

-- Activity history by child + time
CREATE INDEX IF NOT EXISTS idx_activity_history_child_created ON activity_history(child_id, created_at DESC);

-- Chat history by child + time (for loading recent context)
CREATE INDEX IF NOT EXISTS idx_chat_history_child_created ON chat_history(child_id, created_at DESC);

-- Activities by theme + age range (library filter)
CREATE INDEX IF NOT EXISTS idx_activities_theme_age ON activities(theme, min_age, max_age) WHERE status = 'published' AND deleted_at IS NULL;

-- Children by family (soft-delete aware)
CREATE INDEX IF NOT EXISTS idx_children_family_active ON children(family_id) WHERE deleted_at IS NULL;

-- Rewards by child (fast lookup)
CREATE UNIQUE INDEX IF NOT EXISTS idx_rewards_child ON rewards(child_id);

-- Badges code lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_badges_code ON badges(code);

-- Media assets by child/family type
CREATE INDEX IF NOT EXISTS idx_media_assets_child_type ON media_assets(child_id, asset_type) WHERE deleted_at IS NULL;

-- AI providers by family + active
CREATE INDEX IF NOT EXISTS idx_ai_providers_family_active ON ai_providers(family_id, is_active) WHERE deleted_at IS NULL;

-- ============================================
-- 7. RLS Policies — ownership based (replace Allow all)
-- ============================================
-- IMPORTANT: These policies assume Supabase Auth JWT contains `sub` = user_id
-- and that families.parent_user_id matches auth.uid().
-- Adjust if your auth model differs (e.g. using family_id in JWT claims).

-- Helper: is member of family
CREATE OR REPLACE FUNCTION public.is_family_member(family_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM families
    WHERE id = family_uuid AND parent_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old Allow all policies
DROP POLICY IF EXISTS "Allow all" ON families;
DROP POLICY IF EXISTS "Allow all" ON children;
DROP POLICY IF EXISTS "Allow all" ON schedules;
DROP POLICY IF EXISTS "Allow all" ON schedule_items;
DROP POLICY IF EXISTS "Allow all" ON activity_history;
DROP POLICY IF EXISTS "Allow all" ON chat_history;
DROP POLICY IF EXISTS "Allow all" ON rewards;
DROP POLICY IF EXISTS "Allow all" ON child_badges;
DROP POLICY IF EXISTS "Allow all" ON media_assets;
DROP POLICY IF EXISTS "Allow all" ON ai_providers;
DROP POLICY IF EXISTS "Allow all" ON activities;

-- Families: owner full access
CREATE POLICY "families_owner_all"
  ON families FOR ALL
  USING (parent_user_id = auth.uid())
  WITH CHECK (parent_user_id = auth.uid());

-- Children: family members
CREATE POLICY "children_family_select"
  ON children FOR SELECT
  USING (is_family_member(family_id) AND deleted_at IS NULL);
CREATE POLICY "children_family_modify"
  ON children FOR ALL
  USING (is_family_member(family_id))
  WITH CHECK (is_family_member(family_id));

-- Schedules: family members
CREATE POLICY "schedules_family_select"
  ON schedules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = schedules.child_id AND is_family_member(c.family_id) AND schedules.deleted_at IS NULL
  ));
CREATE POLICY "schedules_family_modify"
  ON schedules FOR ALL
  USING (EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = schedules.child_id AND is_family_member(c.family_id)
  ));

-- Schedule items: family members via child
CREATE POLICY "schedule_items_family_select"
  ON schedule_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = schedule_items.child_id AND is_family_member(c.family_id) AND schedule_items.deleted_at IS NULL
  ));
CREATE POLICY "schedule_items_family_modify"
  ON schedule_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = schedule_items.child_id AND is_family_member(c.family_id)
  ));

-- Activity history: family members
CREATE POLICY "activity_history_family_all"
  ON activity_history FOR ALL
  USING (EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = activity_history.child_id AND is_family_member(c.family_id)
  ));

-- Chat history: family members
CREATE POLICY "chat_history_family_all"
  ON chat_history FOR ALL
  USING (EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = chat_history.child_id AND is_family_member(c.family_id)
  ));

-- Rewards: family members
CREATE POLICY "rewards_family_all"
  ON rewards FOR ALL
  USING (EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = rewards.child_id AND is_family_member(c.family_id)
  ));

-- Child badges: family members
CREATE POLICY "child_badges_family_all"
  ON child_badges FOR ALL
  USING (EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = child_badges.child_id AND is_family_member(c.family_id)
  ));

-- Media assets: family members
CREATE POLICY "media_assets_family_select"
  ON media_assets FOR SELECT
  USING (is_family_member(family_id) AND deleted_at IS NULL);
CREATE POLICY "media_assets_family_modify"
  ON media_assets FOR ALL
  USING (is_family_member(family_id))
  WITH CHECK (is_family_member(family_id));

-- AI providers: family members
CREATE POLICY "ai_providers_family_select"
  ON ai_providers FOR SELECT
  USING (is_family_member(family_id) AND deleted_at IS NULL);
CREATE POLICY "ai_providers_family_modify"
  ON ai_providers FOR ALL
  USING (is_family_member(family_id))
  WITH CHECK (is_family_member(family_id));

-- Activities: published readable by anyone; draft/modify restricted to admin/owner
CREATE POLICY "activities_public_published"
  ON activities FOR SELECT
  USING (status = 'published' AND deleted_at IS NULL);
CREATE POLICY "activities_admin_modify"
  ON activities FOR ALL
  USING (created_by = auth.uid()::text OR created_by = 'system');
