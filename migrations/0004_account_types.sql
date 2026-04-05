CREATE TABLE IF NOT EXISTS account_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_account_types_code
ON account_types(code);

INSERT OR IGNORE INTO account_types (code, created_at)
SELECT DISTINCT
  pool_code,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM accounts
WHERE TRIM(pool_code) <> '';

INSERT OR IGNORE INTO account_types (code, created_at)
SELECT DISTINCT
  pool_code,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM cards
WHERE TRIM(pool_code) <> '';
