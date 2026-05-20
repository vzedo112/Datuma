-- Datuma schema. Idempotent — safe to re-run on every boot.

CREATE TABLE IF NOT EXISTS dashboards (
  id           SERIAL PRIMARY KEY,
  user_id      TEXT NOT NULL,
  filename     TEXT NOT NULL,
  row_count    INTEGER NOT NULL DEFAULT 0,
  dashboard    JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dashboards_user_id_idx ON dashboards (user_id);
CREATE INDEX IF NOT EXISTS dashboards_created_at_idx ON dashboards (created_at DESC);
CREATE INDEX IF NOT EXISTS dashboards_user_created_idx ON dashboards (user_id, created_at DESC);

ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS share_token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS dashboards_share_token_idx
  ON dashboards (share_token) WHERE share_token IS NOT NULL;

ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE dashboards
  ADD COLUMN IF NOT EXISTS parent_id INTEGER
  REFERENCES dashboards(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS dashboards_parent_id_idx ON dashboards (parent_id);

-- Chat threads attached to each dashboard. One thread per (dashboard, user).
CREATE TABLE IF NOT EXISTS chat_messages (
  id           SERIAL PRIMARY KEY,
  dashboard_id INTEGER NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_messages_dashboard_idx
  ON chat_messages (dashboard_id, created_at ASC);
CREATE INDEX IF NOT EXISTS chat_messages_user_idx ON chat_messages (user_id);

-- Folders for organising saved dashboards. One folder belongs to one user;
-- a dashboard belongs to at most one folder (NULL = top level / unsorted).
CREATE TABLE IF NOT EXISTS folders (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS folders_user_idx ON folders (user_id, created_at DESC);

ALTER TABLE dashboards
  ADD COLUMN IF NOT EXISTS folder_id INTEGER
  REFERENCES folders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS dashboards_folder_idx ON dashboards (folder_id);

-- Soft-delete: keep the row so quota usage doesn't drop when the user deletes
-- a dashboard, but hide it from all read paths. NULL = not deleted.
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS dashboards_user_deleted_idx
  ON dashboards (user_id) WHERE deleted_at IS NULL;
