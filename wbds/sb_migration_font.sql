ALTER TABLE letters ADD COLUMN font text DEFAULT 'sans';
ALTER TABLE letters ADD COLUMN parent_id uuid REFERENCES letters(id);
