ALTER TABLE cards ADD COLUMN delivery_ref TEXT;

ALTER TABLE cards ADD COLUMN delivered_at TEXT;

CREATE INDEX IF NOT EXISTS idx_cards_delivery_ref
ON cards(delivery_ref, delivered_at);

CREATE INDEX IF NOT EXISTS idx_cards_delivery_pool
ON cards(pool_code, status, delivered_at);
