-- ===========================================
-- Migration 004: Extended Literature & Knowledge Base System
-- ===========================================
-- 
-- Erweitert das Literatursystem um:
-- 1. Projekte/Workspaces für Dokumentensammlung
-- 2. Verknüpfung Literatur <-> Notizen
-- 3. Fulltext-Flag für Dokumente mit verfügbarem PDF
-- 4. Wissensdatenbanken/Collections

-- ===========================================
-- Projects / Workspaces
-- ===========================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7),  -- Hex color for UI
    icon VARCHAR(50),  -- Icon identifier
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project <-> Notes relationship (many-to-many)
CREATE TABLE IF NOT EXISTS project_notes (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (project_id, note_id)
);

-- Project <-> Literature relationship
CREATE TABLE IF NOT EXISTS project_literature (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    literature_id UUID NOT NULL REFERENCES literature(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (project_id, literature_id)
);

-- ===========================================
-- Literature Extensions
-- ===========================================

-- Add fulltext availability flag
ALTER TABLE literature 
    ADD COLUMN IF NOT EXISTS has_fulltext BOOLEAN DEFAULT FALSE;

-- Add abstract column if not exists
ALTER TABLE literature 
    ADD COLUMN IF NOT EXISTS abstract TEXT;

-- Add citation key for easy referencing
ALTER TABLE literature 
    ADD COLUMN IF NOT EXISTS citation_key VARCHAR(100);

-- Add source (imported_from: bibtex, doi, manual, etc.)
ALTER TABLE literature 
    ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';

-- ===========================================
-- Note <-> Literature Citations
-- ===========================================
-- Tracks which literature items are cited in which notes
CREATE TABLE IF NOT EXISTS note_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    literature_id UUID NOT NULL REFERENCES literature(id) ON DELETE CASCADE,
    position INTEGER,  -- Position in document for ordering
    context TEXT,      -- Surrounding text context
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(note_id, literature_id)
);

-- ===========================================
-- Knowledge Bases / Collections
-- ===========================================
-- Central repository that can span multiple projects
CREATE TABLE IF NOT EXISTS knowledge_bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,  -- One default per user
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link literature to knowledge bases
CREATE TABLE IF NOT EXISTS knowledge_base_literature (
    knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    literature_id UUID NOT NULL REFERENCES literature(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,  -- User notes about this item in this collection
    PRIMARY KEY (knowledge_base_id, literature_id)
);

-- ===========================================
-- Indexes
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_notes_project ON project_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_notes_note ON project_notes(note_id);
CREATE INDEX IF NOT EXISTS idx_project_literature_project ON project_literature(project_id);
CREATE INDEX IF NOT EXISTS idx_project_literature_lit ON project_literature(literature_id);
CREATE INDEX IF NOT EXISTS idx_note_citations_note ON note_citations(note_id);
CREATE INDEX IF NOT EXISTS idx_note_citations_literature ON note_citations(literature_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_user ON knowledge_bases(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_literature_kb ON knowledge_base_literature(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_kb_literature_lit ON knowledge_base_literature(literature_id);
CREATE INDEX IF NOT EXISTS idx_literature_citation_key ON literature(citation_key);
CREATE INDEX IF NOT EXISTS idx_literature_has_fulltext ON literature(has_fulltext);

-- ===========================================
-- Triggers
-- ===========================================
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_bases_updated_at ON knowledge_bases;
CREATE TRIGGER update_knowledge_bases_updated_at
    BEFORE UPDATE ON knowledge_bases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Default Knowledge Base Function
-- ===========================================
-- Ensure each user has exactly one default knowledge base
CREATE OR REPLACE FUNCTION ensure_default_knowledge_base()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this as default, unset others
    IF NEW.is_default = TRUE THEN
        UPDATE knowledge_bases 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_default_kb ON knowledge_bases;
CREATE TRIGGER ensure_single_default_kb
    BEFORE INSERT OR UPDATE ON knowledge_bases
    FOR EACH ROW
    WHEN (NEW.is_default = TRUE)
    EXECUTE FUNCTION ensure_default_knowledge_base();

-- ===========================================
-- Migration Record
-- ===========================================
INSERT INTO _migrations (name) VALUES ('004_literature_knowledge_bases')
ON CONFLICT (name) DO NOTHING;

SELECT 'Migration 004 applied successfully' AS status;
