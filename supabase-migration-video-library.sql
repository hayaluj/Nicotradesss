-- Migration: Video Library + Stripe Payments Backend
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- 1. Add video_url column to lessons (self-hosted video support)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_url text;

-- 2. Admin write policies for courses
-- Allow admin users to insert/update/delete courses
CREATE POLICY "Admin can insert courses" ON courses FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email IN ('joelhayalu@gmail.com', 'joel@alextheagent.io'))
  );

CREATE POLICY "Admin can update courses" ON courses FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email IN ('joelhayalu@gmail.com', 'joel@alextheagent.io'))
  );

CREATE POLICY "Admin can delete courses" ON courses FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email IN ('joelhayalu@gmail.com', 'joel@alextheagent.io'))
  );

-- Also allow viewing draft/coming_soon courses for admins
CREATE POLICY "Admin can view all courses" ON courses FOR SELECT
  USING (
    status = 'published' OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email IN ('joelhayalu@gmail.com', 'joel@alextheagent.io'))
  );

-- Drop the old select policy first (it only allows published)
DROP POLICY IF EXISTS "Published courses visible to all" ON courses;

-- 3. Admin write policies for lessons
CREATE POLICY "Admin can insert lessons" ON lessons FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email IN ('joelhayalu@gmail.com', 'joel@alextheagent.io'))
  );

CREATE POLICY "Admin can update lessons" ON lessons FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email IN ('joelhayalu@gmail.com', 'joel@alextheagent.io'))
  );

CREATE POLICY "Admin can delete lessons" ON lessons FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email IN ('joelhayalu@gmail.com', 'joel@alextheagent.io'))
  );

-- Allow admins to see all lessons (including drafts)
DROP POLICY IF EXISTS "Lessons visible to enrolled users" ON lessons;
CREATE POLICY "Lessons visible with access control" ON lessons FOR SELECT USING (
  status = 'published' AND (
    is_free_preview = true OR
    EXISTS (SELECT 1 FROM enrollments e WHERE e.user_id = auth.uid() AND e.course_id = lessons.course_id AND e.status = 'active') OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.tier = 'vip')
  )
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email IN ('joelhayalu@gmail.com', 'joel@alextheagent.io'))
);

-- 4. Admin policies for enrollments (to manage student access)
CREATE POLICY "Admin can manage enrollments" ON enrollments FOR ALL
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email IN ('joelhayalu@gmail.com', 'joel@alextheagent.io'))
  );

-- 5. Payments table (Stripe checkout records)
CREATE TABLE IF NOT EXISTS payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id text UNIQUE,
  stripe_customer_id text,
  email text,
  product text,
  amount integer,
  currency text DEFAULT 'eur',
  status text DEFAULT 'completed',
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can view payments" ON payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email IN ('joelhayalu@gmail.com', 'joel@alextheagent.io'))
  );
-- Service role inserts via webhook (no RLS needed for inserts from server)
CREATE POLICY "Service can insert payments" ON payments FOR INSERT WITH CHECK (true);
