-- Add Shadow Banning Support to Letters
ALTER TABLE letters ADD COLUMN IF NOT EXISTS is_shadow_banned BOOLEAN DEFAULT FALSE;

-- Add Fingerprint tracking to reports for easier banning
ALTER TABLE letter_reports ADD COLUMN IF NOT EXISTS browser_fingerprint TEXT;

-- Index for shadow banning performance
CREATE INDEX IF NOT EXISTS idx_letters_shadow_banned ON letters(is_shadow_banned) WHERE is_shadow_banned = TRUE;
