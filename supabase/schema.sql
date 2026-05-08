-- StoryWeaver database schema
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS sw_projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT 'Untitled',
  data         JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sw_profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL DEFAULT '',
  full_name    TEXT NOT NULL DEFAULT '',
  avatar_url   TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security: users can only see/edit their own projects
ALTER TABLE sw_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sw_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own projects" ON sw_projects;
CREATE POLICY "Users manage own projects" ON sw_projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own profile" ON sw_profiles;
CREATE POLICY "Users manage own profile" ON sw_profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sw_projects_updated_at ON sw_projects;
CREATE TRIGGER sw_projects_updated_at
  BEFORE UPDATE ON sw_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS sw_profiles_updated_at ON sw_profiles;
CREATE TRIGGER sw_profiles_updated_at
  BEFORE UPDATE ON sw_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS sw_projects_user_id_idx ON sw_projects(user_id);
