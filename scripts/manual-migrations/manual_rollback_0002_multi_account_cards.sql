-- Rollback Migration: Multi-Account Cards Support
-- Description: Rollback changes from 0002_multi_account_cards.sql
-- Date: 2026-04-04
-- WARNING: This will remove all multi-account card data!

-- ============================================================================
-- Step 1: Drop card_account_pool table and its indexes
-- ============================================================================

-- Drop indexes first
DROP INDEX IF EXISTS idx_card_account_pool_card_position_active;
DROP INDEX IF EXISTS idx_card_account_pool_account;
DROP INDEX IF EXISTS idx_card_account_pool_card;

-- Drop the table
DROP TABLE IF EXISTS card_account_pool;

-- ============================================================================
-- Step 2: Remove account_quantity field from cards table
-- ============================================================================

-- SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
-- First, create a backup of the cards table
CREATE TABLE cards_backup AS SELECT * FROM cards;

-- Drop the original table
DROP TABLE cards;

-- Recreate the table without account_quantity field
CREATE TABLE cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  type_id INTEGER NOT NULL,
  warranty_hours INTEGER NOT NULL,
  aftersale_limit INTEGER NOT NULL,
  aftersale_used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (type_id) REFERENCES account_types(id)
);

-- Restore data (excluding account_quantity)
INSERT INTO cards (id, code, type_id, warranty_hours, aftersale_limit, aftersale_used, created_at)
SELECT id, code, type_id, warranty_hours, aftersale_limit, aftersale_used, created_at
FROM cards_backup;

-- Drop the backup table
DROP TABLE cards_backup;

-- Recreate indexes for cards table
CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_code ON cards(code);
CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(type_id);

-- ============================================================================
-- Rollback Complete
-- ============================================================================

-- Note: bindings table remains intact and can continue to be used
-- All multi-account card data in card_account_pool has been deleted
