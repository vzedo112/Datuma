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
