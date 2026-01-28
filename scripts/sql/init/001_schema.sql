-- ===========================================
-- Artellitext - Database Schema
-- ===========================================
-- 
-- Full Schema für PostgreSQL 17 + pgvector
-- 
-- Ausführung:
--   psql -U postgres -d Artellitext -f 001_schema.sql
--
-- Dieses Script ist idempotent (kann mehrfach ausgeführt werden)

-- ===========================================
-- Extensions
-- ===========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ===========================================
-- Custom Types (ENUMs)
-- ===========================================

-- User Role
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Subscription Tier
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'team', 'enterprise', 'lifetime');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================
-- Functions
-- ===========================================

-- Auto-Update Timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- Tables
-- ===========================================

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    language VARCHAR(5) DEFAULT 'de',
    theme VARCHAR(10) DEFAULT 'auto',
    email_verified BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT users_subscription_tier_check CHECK (
        subscription_tier IN ('free', 'pro', 'team', 'enterprise', 'lifetime')
    )
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    summary TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    tags TEXT[] DEFAULT '{}',
    language VARCHAR(5) DEFAULT 'de',
    word_count INTEGER DEFAULT 0,
    reading_time INTEGER DEFAULT 0,
    difficulty NUMERIC(3,2),
    location JSONB,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT notes_status_check CHECK (
        status IN ('draft', 'published', 'archived')
    ),
    CONSTRAINT notes_language_check CHECK (
        language IN ('de', 'en', 'fr', 'es', 'it', 'mu')
    )
);

-- Documents (PDFs, EPUBs, etc.)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    metadata JSONB DEFAULT '{}',
    full_text TEXT,
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'processing',
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT documents_status_check CHECK (
        status IN ('processing', 'ready', 'error', 'archived')
    )
);

-- Literature / Citations
CREATE TABLE IF NOT EXISTS literature (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    csl_json JSONB NOT NULL,
    bibtex TEXT,
    title VARCHAR(500),
    authors TEXT[],
    year INTEGER,
    doi VARCHAR(255),
    url TEXT,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrations Tracking
CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- Indexes
-- ===========================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_tier);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Notes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);

-- Notes Embedding (HNSW für schnelle Vektor-Suche)
CREATE INDEX IF NOT EXISTS idx_notes_embedding ON notes 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_mime ON documents(mime_type);
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC);

-- Documents Embedding
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Literature
CREATE INDEX IF NOT EXISTS idx_literature_user_id ON literature(user_id);
CREATE INDEX IF NOT EXISTS idx_literature_document ON literature(document_id);
CREATE INDEX IF NOT EXISTS idx_literature_doi ON literature(doi);
CREATE INDEX IF NOT EXISTS idx_literature_tags ON literature USING GIN(tags);

-- ===========================================
-- Triggers
-- ===========================================

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_literature_updated_at ON literature;
CREATE TRIGGER update_literature_updated_at
    BEFORE UPDATE ON literature
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Initial Migration Record
-- ===========================================
INSERT INTO _migrations (name) VALUES ('001_schema')
ON CONFLICT (name) DO NOTHING;

-- Done
SELECT 'Schema created successfully' AS status;
