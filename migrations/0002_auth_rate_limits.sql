CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  limiter_key TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL,
  blocked_until TEXT,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_rate_limits_action_key
ON auth_rate_limits(action, limiter_key);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_blocked
ON auth_rate_limits(action, blocked_until);
