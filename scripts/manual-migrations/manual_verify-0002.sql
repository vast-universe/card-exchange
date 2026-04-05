-- Verification Script for Migration 0002
-- Run this after executing 0002_multi_account_cards.sql

-- ============================================================================
-- Verification 1: Check record counts match
-- ============================================================================

SELECT 
  'Record Count Verification' AS test,
  (SELECT COUNT(*) FROM bindings) AS bindings_count,
  (SELECT COUNT(*) FROM card_account_pool) AS pool_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM bindings) = (SELECT COUNT(*) FROM card_account_pool)
    THEN 'PASS'
    ELSE 'FAIL'
  END AS result;

-- ============================================================================
-- Verification 2: Check position sequences are correct
-- ============================================================================

-- This should return 0 rows (all cards have correct position sequences)
SELECT 
  'Position Sequence Verification' AS test,
  card_id,
  COUNT(*) AS position_count,
  MIN(position) AS min_position,
  MAX(position) AS max_position
FROM card_account_pool
GROUP BY card_id
HAVING MIN(position) != 1 
   OR MAX(position) != COUNT(*)
   OR COUNT(DISTINCT position) != COUNT(*);

-- ============================================================================
-- Verification 3: Check all existing cards have account_quantity = 1
-- ============================================================================

SELECT 
  'Account Quantity Verification' AS test,
  COUNT(*) AS cards_with_wrong_quantity
FROM cards
WHERE account_quantity != 1;

-- Should return 0

-- ============================================================================
-- Verification 4: Check replaced_by_position relationships
-- ============================================================================

-- This should return 0 rows (all replaced accounts have valid replaced_by_position)
SELECT 
  'Replaced By Position Verification' AS test,
  cap1.id,
  cap1.card_id,
  cap1.position AS replaced_position,
  cap1.replaced_by_position
FROM card_account_pool cap1
WHERE cap1.status = 'replaced'
  AND cap1.replaced_at IS NOT NULL
  AND cap1.replaced_by_position IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM card_account_pool cap2
    WHERE cap2.card_id = cap1.card_id
      AND cap2.position = cap1.replaced_by_position
      AND cap2.status = 'active'
  );

-- ============================================================================
-- Verification 5: Check indexes exist
-- ============================================================================

SELECT 
  'Index Verification' AS test,
  name AS index_name,
  tbl_name AS table_name
FROM sqlite_master
WHERE type = 'index'
  AND tbl_name = 'card_account_pool'
ORDER BY name;

-- Should show:
-- - idx_card_account_pool_account
-- - idx_card_account_pool_card
-- - idx_card_account_pool_card_position_active

-- ============================================================================
-- Verification 6: Check unique constraint on active positions
-- ============================================================================

-- This should return 0 rows (no duplicate active positions per card)
SELECT 
  'Unique Active Position Verification' AS test,
  card_id,
  position,
  COUNT(*) AS duplicate_count
FROM card_account_pool
WHERE status = 'active'
GROUP BY card_id, position
HAVING COUNT(*) > 1;

-- ============================================================================
-- Summary
-- ============================================================================

SELECT 
  'Migration Verification Summary' AS summary,
  (SELECT COUNT(*) FROM card_account_pool) AS total_pool_records,
  (SELECT COUNT(*) FROM card_account_pool WHERE status = 'active') AS active_records,
  (SELECT COUNT(*) FROM card_account_pool WHERE status = 'replaced') AS replaced_records,
  (SELECT COUNT(DISTINCT card_id) FROM card_account_pool) AS cards_with_accounts,
  (SELECT COUNT(*) FROM cards WHERE account_quantity = 1) AS single_account_cards;
