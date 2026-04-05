ALTER TABLE cards ADD COLUMN warranty_hours INTEGER NOT NULL DEFAULT 24;

ALTER TABLE cards ADD COLUMN warranty_started_at TEXT;

ALTER TABLE cards ADD COLUMN warranty_expires_at TEXT;

UPDATE cards
SET warranty_started_at = (
      SELECT MIN(bindings.created_at)
      FROM bindings
      WHERE bindings.card_id = cards.id
    ),
    warranty_expires_at = CASE
      WHEN EXISTS (
        SELECT 1
        FROM bindings
        WHERE bindings.card_id = cards.id
      )
      THEN strftime(
        '%Y-%m-%dT%H:%M:%fZ',
        datetime(
          (
            SELECT MIN(bindings.created_at)
            FROM bindings
            WHERE bindings.card_id = cards.id
          ),
          '+' || cards.warranty_hours || ' hours'
        )
      )
      ELSE NULL
    END
WHERE EXISTS (
  SELECT 1
  FROM bindings
  WHERE bindings.card_id = cards.id
);
