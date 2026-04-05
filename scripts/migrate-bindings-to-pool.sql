-- Migration Script: Migrate bindings to card_account_pool
-- This script migrates all existing bindings records to the card_account_pool table
-- to unify single-account and multi-account card handling

-- Step 1: Migrate active bindings to card_account_pool
-- For each card, set position = 1 since these are single-account cards
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
  1 AS position,  -- Single account cards always have position 1
  CASE 
    WHEN b.status = 'active' THEN 'active'
    WHEN b.status = 'ended' THEN 'replaced'
    ELSE 'active'
  END AS status,
  b.created_at,
  b.ended_at AS replaced_at,
  NULL AS replaced_by_position
FROM bindings b
WHERE NOT EXISTS (
  -- Don't migrate if already exists in card_account_pool
  SELECT 1 FROM card_account_pool cap 
  WHERE cap.card_id = b.card_id 
    AND cap.account_id = b.account_id
);

-- Step 2: Update replaced_by_position for replaced accounts
-- Find the replacement account for each replaced binding
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
  AND replaced_at IS NOT NULL
  AND replaced_by_position IS NULL;

-- Step 3: Verify migration
SELECT 
  'Migration Summary' AS info,
  (SELECT COUNT(*) FROM bindings) AS total_bindings,
  (SELECT COUNT(*) FROM bindings WHERE status = 'active') AS active_bindings,
  (SELECT COUNT(*) FROM card_account_pool) AS total_pool_records,
  (SELECT COUNT(*) FROM card_account_pool WHERE status = 'active') AS active_pool_records;

-- Step 4: Show any cards that might have issues
SELECT 
  'Cards with multiple positions (should only be multi-account cards)' AS info,
  card_id,
  COUNT(*) AS position_count
FROM card_account_pool
WHERE status = 'active'
GROUP BY card_id
HAVING COUNT(*) > 1;
