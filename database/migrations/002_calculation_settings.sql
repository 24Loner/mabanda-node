-- PostgreSQL baseline schema already includes ranking_method and calculation messages.
-- This migration is intentionally idempotent for databases upgraded from earlier baselines.
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS ranking_method ranking_method_type NOT NULL DEFAULT 'competition';
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS excellent_message VARCHAR(500);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS good_message VARCHAR(500);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS fail_message VARCHAR(500);
