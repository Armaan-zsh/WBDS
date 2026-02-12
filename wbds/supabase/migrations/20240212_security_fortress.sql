-- ==============================================
-- WBDS Database Fortress (Security Hardening)
-- ==============================================

-- 1. Enable RLS on all tables
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE letter_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- 2. LETTERS Table Policies
-- Allow public (anon) to read non-deleted letters
DROP POLICY IF EXISTS "Public letters are viewable by everyone" ON letters;
CREATE POLICY "Public letters are viewable by everyone"
ON letters FOR SELECT
TO anon
USING (is_deleted = FALSE AND (unlock_at IS NULL OR unlock_at <= NOW()));

-- Restrict INSERT, UPDATE, DELETE to service_role (Server-Side) only
DROP POLICY IF EXISTS "Service role has full access to letters" ON letters;
CREATE POLICY "Service role has full access to letters"
ON letters FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. OTHER Tables (Admin/Anti-Spam)
-- These should NEVER be accessible via the public anon key.

-- IP REPUTATION
DROP POLICY IF EXISTS "Admin only ip_reputation" ON ip_reputation;
CREATE POLICY "Admin only ip_reputation"
ON ip_reputation FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- LETTER REPORTS
DROP POLICY IF EXISTS "Admin only letter_reports" ON letter_reports;
CREATE POLICY "Admin only letter_reports"
ON letter_reports FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ADMIN ACTIONS
DROP POLICY IF EXISTS "Admin only admin_actions" ON admin_actions;
CREATE POLICY "Admin only admin_actions"
ON admin_actions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RATE LIMITS
DROP POLICY IF EXISTS "Admin only rate_limits" ON rate_limits;
CREATE POLICY "Admin only rate_limits"
ON rate_limits FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. PRIVACY ENHANCEMENT: IP Anonymization (Optional utility)
-- Run this to hash existing IPs in the letters table for max anonymity
-- UPDATE letters SET ip_address = encode(digest(ip_address, 'sha256'), 'hex');
