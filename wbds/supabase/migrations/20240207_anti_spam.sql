-- ==============================================
-- WBDS Anti-Spam System Database Migration
-- Run this in Supabase SQL Editor
-- ==============================================

-- IP Reputation Table
CREATE TABLE IF NOT EXISTS ip_reputation (
    ip TEXT PRIMARY KEY,
    browser_fingerprint TEXT,
    trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
    total_posts INTEGER DEFAULT 0,
    flagged_posts INTEGER DEFAULT 0,
    is_banned BOOLEAN DEFAULT FALSE,
    banned_until TIMESTAMP,
    last_action TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fingerprint lookups
CREATE INDEX IF NOT EXISTS idx_ip_reputation_fingerprint ON ip_reputation(browser_fingerprint);

-- Add toxicity columns to letters
ALTER TABLE letters ADD COLUMN IF NOT EXISTS ai_toxicity_score FLOAT;
ALTER TABLE letters ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE;
ALTER TABLE letters ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Letter Reports Table
CREATE TABLE IF NOT EXISTS letter_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    letter_id BIGINT REFERENCES letters(id) ON DELETE CASCADE,
    reporter_ip TEXT NOT NULL,
    reason TEXT CHECK (reason IN ('spam', 'harassment', 'self_harm', 'illegal', 'other')),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    toxicity_score FLOAT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP,
    action_taken TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Admin Actions Audit Log
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('delete_letter', 'ban_ip', 'unban_ip', 'dismiss', 'resolve')),
    target_letter_id BIGINT,
    target_report_id UUID,
    target_ip TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Content hash for duplicate detection
CREATE TABLE IF NOT EXISTS content_hashes (
    hash TEXT PRIMARY KEY,
    first_seen TIMESTAMP DEFAULT NOW(),
    occurrence_count INTEGER DEFAULT 1,
    ip_list TEXT[] DEFAULT '{}'
);

-- Indexes for faster admin queries
CREATE INDEX IF NOT EXISTS idx_letter_reports_status ON letter_reports(status);
CREATE INDEX IF NOT EXISTS idx_admin_actions_date ON admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_letters_needs_review ON letters(needs_review) WHERE needs_review = TRUE;
