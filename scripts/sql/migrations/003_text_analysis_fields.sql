-- ===========================================
-- Migration: Add Text Analysis Fields
-- ===========================================
-- 
-- Adds fields for readability analysis, GER levels, etc.
-- 
-- Part of: Sprint 03 - Client-Side AI

-- Add text analysis columns to notes
ALTER TABLE notes 
    ADD COLUMN IF NOT EXISTS flesch_reading_ease NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS flesch_kincaid_grade NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS wiener_sachtextformel NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS ger_level VARCHAR(2),
    ADD COLUMN IF NOT EXISTS reading_level_de VARCHAR(50),
    ADD COLUMN IF NOT EXISTS reading_level_at VARCHAR(50),
    ADD COLUMN IF NOT EXISTS reading_level_us VARCHAR(50);

-- Add constraints for GER level
ALTER TABLE notes 
    DROP CONSTRAINT IF EXISTS notes_ger_level_check;
ALTER TABLE notes 
    ADD CONSTRAINT notes_ger_level_check CHECK (
        ger_level IS NULL OR ger_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
    );

-- Index for GER level filtering
CREATE INDEX IF NOT EXISTS idx_notes_ger_level ON notes(ger_level);

-- Record migration
INSERT INTO _migrations (name) VALUES ('003_text_analysis_fields')
ON CONFLICT (name) DO NOTHING;

SELECT 'Migration 003_text_analysis_fields applied' AS status;
