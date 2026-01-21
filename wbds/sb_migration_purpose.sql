-- Migration: Add columns for Purpose Protection and Archive Growth
ALTER TABLE letters ADD COLUMN IF NOT EXISTS recipient_type text DEFAULT 'unknown';
ALTER TABLE letters ADD COLUMN IF NOT EXISTS is_purpose_match boolean DEFAULT true;
ALTER TABLE letters ADD COLUMN IF NOT EXISTS has_crisis_flag boolean DEFAULT false;

-- Add index for recipient_type for future filtering
CREATE INDEX IF NOT EXISTS idx_letters_recipient_type ON letters(recipient_type);
