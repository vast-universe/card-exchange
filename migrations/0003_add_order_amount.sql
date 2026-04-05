-- Migration: Add order_amount field to cards table
-- This field stores the order amount from external API calls

ALTER TABLE cards ADD COLUMN order_amount REAL;

-- Create index for order amount queries
CREATE INDEX idx_cards_order_amount ON cards(order_amount);
