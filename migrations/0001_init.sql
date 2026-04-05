CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pool_code TEXT NOT NULL,
  payload_raw TEXT NOT NULL,
  stock_status TEXT NOT NULL DEFAULT 'available'
    CHECK (stock_status IN ('available', 'bound', 'disabled')),
  check_status TEXT NOT NULL DEFAULT 'ok'
    CHECK (check_status IN ('ok', 'banned', 'unknown')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_accounts_pool
ON accounts(pool_code, stock_status, check_status);

CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code_hash TEXT NOT NULL UNIQUE,
  pool_code TEXT NOT NULL,
  query_token TEXT,
  aftersale_limit INTEGER NOT NULL DEFAULT 0,
  aftersale_used INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'normal'
    CHECK (status IN ('normal', 'disabled')),
  lock_until TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cards_pool
ON cards(pool_code, status);

CREATE TABLE IF NOT EXISTS bindings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  kind TEXT NOT NULL
    CHECK (kind IN ('redeem', 'replace')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'ended')),
  created_at TEXT NOT NULL,
  ended_at TEXT,
  FOREIGN KEY (card_id) REFERENCES cards(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bindings_active_card
ON bindings(card_id)
WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_bindings_active_account
ON bindings(account_id)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_bindings_created
ON bindings(created_at, kind);
