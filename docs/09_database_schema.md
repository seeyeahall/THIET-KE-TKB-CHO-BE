# Database Schema

## Nen tang

Database chinh dung Supabase Postgres. Backend Python FastAPI truy cap qua Supabase client hoac SQLAlchemy + Postgres connection string.

## Bang MVP

### families

- id uuid primary key.
- parent_user_id uuid.
- name text.
- created_at timestamptz.

### children

- id uuid primary key.
- family_id uuid references families.
- name text.
- avatar_url text.
- age int.
- favorite_color text.
- favorite_animal text.
- interests jsonb.
- dislikes jsonb.
- parent_notes text.
- created_at timestamptz.

### activities

- id uuid primary key.
- title text.
- slug text unique.
- theme text.
- description text.
- image_url text.
- min_age int.
- max_age int.
- duration_minutes int.
- difficulty text.
- instructions jsonb.
- materials jsonb.
- learning_goals jsonb.
- safety_notes text.
- requires_parent boolean.
- created_by text.
- status text.
- created_at timestamptz.

### schedules

- id uuid primary key.
- child_id uuid references children.
- title text.
- week_start_date date.
- theme text.
- status text.
- created_by text.
- created_at timestamptz.

### schedule_items

- id uuid primary key.
- schedule_id uuid references schedules.
- child_id uuid references children.
- activity_id uuid references activities.
- day_of_week int.
- start_time time.
- duration_minutes int.
- sort_order int.
- status text.
- completed_at timestamptz.
- created_at timestamptz.

### activity_history

- id uuid primary key.
- child_id uuid references children.
- activity_id uuid references activities.
- schedule_item_id uuid references schedule_items.
- status text.
- notes text.
- created_at timestamptz.

### chat_history

- id uuid primary key.
- child_id uuid references children.
- role text.
- message text.
- metadata jsonb.
- created_at timestamptz.

### rewards

- id uuid primary key.
- child_id uuid references children.
- coins int.
- xp int.
- updated_at timestamptz.

### badges

- id uuid primary key.
- code text unique.
- title text.
- description text.
- image_url text.
- rule jsonb.

### child_badges

- id uuid primary key.
- child_id uuid references children.
- badge_id uuid references badges.
- awarded_at timestamptz.

### ai_providers

- id uuid primary key.
- family_id uuid references families nullable.
- name text.
- provider_type text.
- endpoint text.
- api_key_encrypted text.
- model text.
- capabilities jsonb.
- is_active boolean.
- is_default boolean.
- last_test_status text.
- last_tested_at timestamptz.
- created_at timestamptz.

### media_assets

- id uuid primary key.
- family_id uuid references families nullable.
- child_id uuid references children nullable.
- bucket text.
- path text.
- public_url text.
- asset_type text.
- source text.
- metadata jsonb.
- created_at timestamptz.

## RLS

Supabase RLS nen bat cho cac bang co du lieu gia dinh:

- families.
- children.
- schedules.
- schedule_items.
- activity_history.
- chat_history.
- rewards.
- child_badges.
- media_assets.
- ai_providers.

Activities published co the public read. Activities draft chi admin/owner doc.

