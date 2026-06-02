-- Kid Adventure Planner — Initial Migration
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- families
CREATE TABLE IF NOT EXISTS families (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_user_id uuid,
  name text,
  created_at timestamptz DEFAULT now()
);

-- children
CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar_url text,
  age int,
  favorite_color text,
  favorite_animal text,
  interests jsonb DEFAULT '[]',
  dislikes jsonb DEFAULT '[]',
  parent_notes text,
  created_at timestamptz DEFAULT now()
);

-- activities
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text UNIQUE,
  theme text,
  description text,
  image_url text,
  min_age int,
  max_age int,
  duration_minutes int,
  difficulty text,
  instructions jsonb DEFAULT '[]',
  materials jsonb DEFAULT '[]',
  learning_goals jsonb DEFAULT '[]',
  safety_notes text,
  requires_parent boolean DEFAULT false,
  created_by text,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);

-- schedules
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  title text,
  week_start_date date,
  theme text,
  status text DEFAULT 'active',
  created_by text,
  created_at timestamptz DEFAULT now()
);

-- schedule_items
CREATE TABLE IF NOT EXISTS schedule_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id uuid REFERENCES schedules(id) ON DELETE CASCADE,
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
  day_of_week int,
  start_time time,
  duration_minutes int,
  sort_order int DEFAULT 0,
  status text DEFAULT 'planned',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- activity_history
CREATE TABLE IF NOT EXISTS activity_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
  schedule_item_id uuid REFERENCES schedule_items(id) ON DELETE SET NULL,
  status text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- chat_history
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  role text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- rewards
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  coins int DEFAULT 0,
  xp int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- badges
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE,
  title text,
  description text,
  image_url text,
  rule jsonb DEFAULT '{}'
);

-- child_badges
CREATE TABLE IF NOT EXISTS child_badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at timestamptz DEFAULT now()
);

-- ai_providers
CREATE TABLE IF NOT EXISTS ai_providers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  name text,
  provider_type text,
  endpoint text,
  api_key_encrypted text,
  model text,
  capabilities jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  last_test_status text,
  last_tested_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- media_assets
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  bucket text,
  path text,
  public_url text,
  asset_type text,
  source text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all for setup; tighten later with Supabase Auth integration)
CREATE POLICY "Allow all" ON families FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON children FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON schedule_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON activity_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON chat_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON rewards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON child_badges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON media_assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON ai_providers FOR ALL USING (true) WITH CHECK (true);

-- activities: published can be read by anyone; draft restricted later
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON activities FOR ALL USING (true) WITH CHECK (true);

-- indexes
CREATE INDEX idx_children_family ON children(family_id);
CREATE INDEX idx_schedules_child ON schedules(child_id);
CREATE INDEX idx_schedule_items_schedule ON schedule_items(schedule_id);
CREATE INDEX idx_schedule_items_child ON schedule_items(child_id);
CREATE INDEX idx_activity_history_child ON activity_history(child_id);
CREATE INDEX idx_chat_history_child ON chat_history(child_id);
CREATE INDEX idx_rewards_child ON rewards(child_id);
CREATE INDEX idx_media_assets_family ON media_assets(family_id);
