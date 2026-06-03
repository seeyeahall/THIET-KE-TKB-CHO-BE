-- Create Supabase Storage buckets for media assets
-- Run this in Supabase SQL Editor after enabling Storage

-- Avatars bucket (private by default, public access via signed URL or RLS)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Activity images bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('activity-images', 'activity-images', true)
ON CONFLICT (id) DO NOTHING;

-- Theme images bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('theme-images', 'theme-images', true)
ON CONFLICT (id) DO NOTHING;

-- Chat images bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', false)
ON CONFLICT (id) DO NOTHING;

-- Set bucket policies (simplified for MVP - restrict by path pattern containing family_id)
-- Allow authenticated users to upload to their own family folder
CREATE POLICY IF NOT EXISTS "avatars_upload_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "avatars_select_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "activity_images_public_select"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'activity-images');

CREATE POLICY IF NOT EXISTS "activity_images_upload_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'activity-images');

CREATE POLICY IF NOT EXISTS "theme_images_public_select"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'theme-images');

CREATE POLICY IF NOT EXISTS "chat_images_select_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'chat-images');
