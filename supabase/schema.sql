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

-- Row Level Security: users can only see/edit their own projects
ALTER TABLE sw_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own projects" ON sw_projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sw_projects_updated_at
  BEFORE UPDATE ON sw_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS sw_projects_user_id_idx ON sw_projects(user_id);
