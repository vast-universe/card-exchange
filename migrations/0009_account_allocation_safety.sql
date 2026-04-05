-- Migration: Account Allocation Safety
-- Description: Add constraints to prevent race conditions in account allocation
-- Date: 2026-04-05

-- ============================================================================
-- Step 1: Add unique constraint for active account allocations
-- ============================================================================

-- Ensure an account can only be actively allocated to one card at a time
-- This prevents race conditions where the same account might be allocated twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_card_account_pool_account_active
ON card_account_pool(account_id)
WHERE status = 'active';

-- ============================================================================
-- Step 2: Add check constraint for account status consistency
-- ============================================================================

-- Note: SQLite doesn't support adding CHECK constraints to existing tables
-- This is documented for future reference and manual verification

-- The following constraint should be verified manually:
-- When an account is in card_account_pool with status='active',
-- the corresponding accounts.stock_status should be 'bound'

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- This migration adds database-level protection against race conditions
-- by ensuring that an account can only be actively allocated once.
