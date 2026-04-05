ALTER TABLE cards ADD COLUMN code_plain TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_code_plain
ON cards(code_plain);
