-- Migration: Add unique constraint for delivery_ref
-- Description: Ensure idempotency for external supply API
-- Date: 2026-04-05

-- Create unique index on delivery_ref (excluding NULL values)
-- This prevents duplicate deliveries with the same reference
CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_delivery_ref_unique
ON cards(delivery_ref)
WHERE delivery_ref IS NOT NULL;
