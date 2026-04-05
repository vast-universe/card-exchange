-- Migration: Multi-Account Cards Support
-- Description: Add support for cards with multiple accounts
-- Date: 2026-04-04

-- ============================================================================
-- Step 1: Create card_account_pool table
-- ============================================================================

CREATE TABLE IF NOT EXISTS card_account_pool (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'replaced')),
  created_at TEXT NOT NULL,
  replaced_at TEXT,
  replaced_by_position INTEGER,
  FOREIGN KEY (card_id) REFERENCES cards(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Create indexes for card_account_pool
CREATE INDEX IF NOT EXISTS idx_card_account_pool_card
ON card_account_pool(card_id, status);

CREATE INDEX IF NOT EXISTS idx_card_account_pool_account
ON card_account_pool(account_id);

-- Ensure only one active account per card position
CREATE UNIQUE INDEX IF NOT EXISTS idx_card_account_pool_card_position_active
ON card_account_pool(card_id, position)
WHERE status = 'active';

-- ============================================================================
-- Step 2: Add account_quantity field to cards table
-- ============================================================================

ALTER TABLE cards ADD COLUMN account_quantity INTEGER NOT NULL DEFAULT 1;

-- ============================================================================
-- Step 3: Migrate existing bindings data to card_account_pool
-- ============================================================================

-- Migrate all bindings to card_account_pool with calculated position
INSERT INTO card_account_pool (
  card_id,
  account_id,
  position,
  status,
  created_at,
  replaced_at,
  replaced_by_position
)
SELECT 
  b.card_id,
  b.account_id,
  -- Calculate position: count all bindings for this card up to current record
  (SELECT COUNT(*) 
   FROM bindings b2 
   WHERE b2.card_id = b.card_id 
     AND b2.created_at <= b.created_at) AS position,
  b.status,
  b.created_at,
  b.ended_at AS replaced_at,
  NULL AS replaced_by_position
FROM bindings b
ORDER BY b.card_id, b.created_at;

-- ============================================================================
-- Step 4: Update replaced_by_position relationships
-- ============================================================================

-- For each replaced account, find the next active account that replaced it
UPDATE card_account_pool
SET replaced_by_position = (
  SELECT cap2.position
  FROM card_account_pool cap2
  WHERE cap2.card_id = card_account_pool.card_id
    AND cap2.status = 'active'
    AND cap2.created_at > card_account_pool.replaced_at
  ORDER BY cap2.created_at ASC
  LIMIT 1
)
WHERE status = 'replaced'
  AND replaced_at IS NOT NULL;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Note: bindings table is preserved as backup and not deleted
