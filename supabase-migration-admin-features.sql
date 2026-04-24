-- Migration: Admin features - user_documents, user_videos, trading_signals policies
-- Run this in your Supabase SQL editor

-- ============================================
-- 1. user_documents table
-- ============================================
CREATE TABLE IF NOT EXISTS user_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  file_url text NOT NULL,
  uploaded_by text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
  ON user_documents FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can insert documents
CREATE POLICY "Admins can insert documents"
  ON user_documents FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' IN ('hayaluj@gmail.com', 'nico@nicotradesss.com')
  );

-- Admins can delete documents
CREATE POLICY "Admins can delete documents"
  ON user_documents FOR DELETE
  USING (
    auth.jwt() ->> 'email' IN ('hayaluj@gmail.com', 'nico@nicotradesss.com')
  );

-- ============================================
-- 2. user_videos table
-- ============================================
CREATE TABLE IF NOT EXISTS user_videos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  youtube_id text NOT NULL,
  description text,
  uploaded_by text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_videos ENABLE ROW LEVEL SECURITY;

-- Users can view their own videos
CREATE POLICY "Users can view own videos"
  ON user_videos FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can insert videos
CREATE POLICY "Admins can insert videos"
  ON user_videos FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' IN ('hayaluj@gmail.com', 'nico@nicotradesss.com')
  );

-- Admins can delete videos
CREATE POLICY "Admins can delete videos"
  ON user_videos FOR DELETE
  USING (
    auth.jwt() ->> 'email' IN ('hayaluj@gmail.com', 'nico@nicotradesss.com')
  );

-- ============================================
-- 3. trading_signals admin policies
-- ============================================
-- (Table already exists, just adding admin policies)

CREATE POLICY "Admins can insert signals"
  ON trading_signals FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' IN ('hayaluj@gmail.com', 'nico@nicotradesss.com')
  );

CREATE POLICY "Admins can update signals"
  ON trading_signals FOR UPDATE
  USING (
    auth.jwt() ->> 'email' IN ('hayaluj@gmail.com', 'nico@nicotradesss.com')
  );

CREATE POLICY "Admins can delete signals"
  ON trading_signals FOR DELETE
  USING (
    auth.jwt() ->> 'email' IN ('hayaluj@gmail.com', 'nico@nicotradesss.com')
  );
