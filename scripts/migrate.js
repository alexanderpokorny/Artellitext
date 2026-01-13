#!/usr/bin/env node
/**
 * Artellico - Database Migration Script
 * 
 * Initialisiert das Datenbankschema und führt Migrationen aus.
 * 
 * Usage:
 *   npm run db:migrate
 *   node scripts/migrate.js
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/Artellitext';

// Farben für Konsole
const colors = {
	green: (text) => `\x1b[32m${text}\x1b[0m`,
	red: (text) => `\x1b[31m${text}\x1b[0m`,
	yellow: (text) => `\x1b[33m${text}\x1b[0m`,
	blue: (text) => `\x1b[34m${text}\x1b[0m`,
	bold: (text) => `\x1b[1m${text}\x1b[0m`
};

console.log(colors.bold('\n🗄️  Artellico Database Migration\n'));
console.log('─'.repeat(50));

const pool = new Pool({
	connectionString: DATABASE_URL,
	max: 5,
	connectionTimeoutMillis: 10000
});

async function migrate() {
	const client = await pool.connect();
	
	try {
		console.log(colors.blue('\n📡 Verbinde mit Datenbank...'));
		
		// Test connection
		const versionResult = await client.query('SELECT version()');
		console.log(colors.green(`✓ Verbunden: PostgreSQL ${versionResult.rows[0].version.split(' ')[1]}`));
		
		await client.query('BEGIN');
		
		// ===========================================
		// 1. Extensions
		// ===========================================
		console.log(colors.yellow('\n🔌 Extensions aktivieren...'));
		
		await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
		console.log('  ✓ uuid-ossp');
		
		await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
		console.log('  ✓ pgcrypto');
		
		await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
		console.log('  ✓ pgvector');
		
		// ===========================================
		// 2. Enums / Types
		// ===========================================
		console.log(colors.yellow('\n📋 Types erstellen...'));
		
		await client.query(`
			DO $$ BEGIN
				CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');
			EXCEPTION
				WHEN duplicate_object THEN NULL;
			END $$;
		`);
		console.log('  ✓ user_role enum');
		
		await client.query(`
			DO $$ BEGIN
				CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'team', 'enterprise');
			EXCEPTION
				WHEN duplicate_object THEN NULL;
			END $$;
		`);
		console.log('  ✓ subscription_tier enum');
		
		await client.query(`
			DO $$ BEGIN
				CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
			EXCEPTION
				WHEN duplicate_object THEN NULL;
			END $$;
		`);
		console.log('  ✓ content_status enum');
		
		await client.query(`
			DO $$ BEGIN
				CREATE TYPE document_status AS ENUM ('processing', 'ready', 'error', 'archived');
			EXCEPTION
				WHEN duplicate_object THEN NULL;
			END $$;
		`);
		console.log('  ✓ document_status enum');
		
		// ===========================================
		// 3. Users Table
		// ===========================================
		console.log(colors.yellow('\n👤 Users Tabelle...'));
		
		await client.query(`
			CREATE TABLE IF NOT EXISTS users (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				email VARCHAR(255) UNIQUE NOT NULL,
				username VARCHAR(50) UNIQUE NOT NULL,
				password_hash VARCHAR(255) NOT NULL,
				display_name VARCHAR(100),
				avatar_url TEXT,
				role user_role DEFAULT 'user',
				subscription_tier subscription_tier DEFAULT 'free',
				language VARCHAR(5) DEFAULT 'de',
				theme VARCHAR(10) DEFAULT 'auto',
				email_verified BOOLEAN DEFAULT FALSE,
				settings JSONB DEFAULT '{}'::jsonb,
				created_at TIMESTAMPTZ DEFAULT NOW(),
				updated_at TIMESTAMPTZ DEFAULT NOW()
			);
		`);
		console.log('  ✓ users');
		
		// ===========================================
		// 4. Sessions Table
		// ===========================================
		console.log(colors.yellow('\n🔐 Sessions Tabelle...'));
		
		await client.query(`
			CREATE TABLE IF NOT EXISTS sessions (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				token VARCHAR(255) UNIQUE NOT NULL,
				expires_at TIMESTAMPTZ NOT NULL,
				user_agent TEXT,
				ip_address INET,
				created_at TIMESTAMPTZ DEFAULT NOW()
			);
			
			CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
			CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
			CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
		`);
		console.log('  ✓ sessions');
		
		// ===========================================
		// 5. Notes Table
		// ===========================================
		console.log(colors.yellow('\n📝 Notes Tabelle...'));
		
		await client.query(`
			CREATE TABLE IF NOT EXISTS notes (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				title VARCHAR(500) NOT NULL,
				content JSONB NOT NULL DEFAULT '{}'::jsonb,
				summary TEXT,
				status content_status DEFAULT 'draft',
				tags TEXT[] DEFAULT '{}',
				language VARCHAR(5) DEFAULT 'de',
				word_count INTEGER DEFAULT 0,
				reading_time INTEGER DEFAULT 0,
				difficulty DECIMAL(3,2),
				location JSONB,
				embedding vector(1536),
				created_at TIMESTAMPTZ DEFAULT NOW(),
				updated_at TIMESTAMPTZ DEFAULT NOW()
			);
			
			CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
			CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);
			CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);
			CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC);
			CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);
		`);
		console.log('  ✓ notes');
		
		// ===========================================
		// 6. Documents Table
		// ===========================================
		console.log(colors.yellow('\n📄 Documents Tabelle...'));
		
		await client.query(`
			CREATE TABLE IF NOT EXISTS documents (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				title VARCHAR(500) NOT NULL,
				filename VARCHAR(255) NOT NULL,
				mime_type VARCHAR(100) NOT NULL,
				size BIGINT NOT NULL,
				storage_path TEXT NOT NULL,
				thumbnail_path TEXT,
				metadata JSONB DEFAULT '{}'::jsonb,
				full_text TEXT,
				tags TEXT[] DEFAULT '{}',
				status document_status DEFAULT 'processing',
				embedding vector(1536),
				created_at TIMESTAMPTZ DEFAULT NOW(),
				updated_at TIMESTAMPTZ DEFAULT NOW()
			);
			
			CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
			CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
			CREATE INDEX IF NOT EXISTS idx_documents_mime ON documents(mime_type);
			CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC);
		`);
		console.log('  ✓ documents');
		
		// ===========================================
		// 7. Literature / References Table
		// ===========================================
		console.log(colors.yellow('\n📚 Literature Tabelle...'));
		
		await client.query(`
			CREATE TABLE IF NOT EXISTS literature (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				title VARCHAR(500) NOT NULL,
				authors TEXT[] DEFAULT '{}',
				year INTEGER,
				publisher VARCHAR(255),
				journal VARCHAR(255),
				volume VARCHAR(50),
				issue VARCHAR(50),
				pages VARCHAR(50),
				doi VARCHAR(100),
				isbn VARCHAR(20),
				url TEXT,
				abstract TEXT,
				citation_key VARCHAR(100),
				bibtex TEXT,
				tags TEXT[] DEFAULT '{}',
				notes TEXT,
				pdf_path TEXT,
				embedding vector(1536),
				created_at TIMESTAMPTZ DEFAULT NOW(),
				updated_at TIMESTAMPTZ DEFAULT NOW()
			);
			
			CREATE INDEX IF NOT EXISTS idx_literature_user_id ON literature(user_id);
			CREATE INDEX IF NOT EXISTS idx_literature_authors ON literature USING GIN(authors);
			CREATE INDEX IF NOT EXISTS idx_literature_tags ON literature USING GIN(tags);
			CREATE INDEX IF NOT EXISTS idx_literature_doi ON literature(doi);
			CREATE UNIQUE INDEX IF NOT EXISTS idx_literature_citation_key ON literature(user_id, citation_key);
		`);
		console.log('  ✓ literature');
		
		// ===========================================
		// 8. Vector Search Indexes (HNSW)
		// ===========================================
		console.log(colors.yellow('\n🔍 Vector Indexes...'));
		
		try {
			await client.query(`
				CREATE INDEX IF NOT EXISTS idx_notes_embedding ON notes 
				USING hnsw (embedding vector_cosine_ops) 
				WITH (m = 16, ef_construction = 64);
			`);
			console.log('  ✓ notes HNSW index');
		} catch (e) {
			console.log('  ○ notes HNSW index (skipped)');
		}
		
		try {
			await client.query(`
				CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents 
				USING hnsw (embedding vector_cosine_ops) 
				WITH (m = 16, ef_construction = 64);
			`);
			console.log('  ✓ documents HNSW index');
		} catch (e) {
			console.log('  ○ documents HNSW index (skipped)');
		}
		
		try {
			await client.query(`
				CREATE INDEX IF NOT EXISTS idx_literature_embedding ON literature 
				USING hnsw (embedding vector_cosine_ops) 
				WITH (m = 16, ef_construction = 64);
			`);
			console.log('  ✓ literature HNSW index');
		} catch (e) {
			console.log('  ○ literature HNSW index (skipped)');
		}
		
		// ===========================================
		// 9. Triggers
		// ===========================================
		console.log(colors.yellow('\n⚡ Triggers...'));
		
		await client.query(`
			CREATE OR REPLACE FUNCTION update_updated_at_column()
			RETURNS TRIGGER AS $$
			BEGIN
				NEW.updated_at = NOW();
				RETURN NEW;
			END;
			$$ language 'plpgsql';
		`);
		
		const tables = ['users', 'notes', 'documents', 'literature'];
		for (const table of tables) {
			await client.query(`
				DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
				CREATE TRIGGER update_${table}_updated_at
					BEFORE UPDATE ON ${table}
					FOR EACH ROW
					EXECUTE FUNCTION update_updated_at_column();
			`);
			console.log(`  ✓ ${table}_updated_at trigger`);
		}
		
		// ===========================================
		// 10. Migration Log Table
		// ===========================================
		console.log(colors.yellow('\n📋 Migrations Log...'));
		
		await client.query(`
			CREATE TABLE IF NOT EXISTS _migrations (
				id SERIAL PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				applied_at TIMESTAMPTZ DEFAULT NOW()
			);
		`);
		
		// Log this migration
		await client.query(`
			INSERT INTO _migrations (name) 
			VALUES ('001_initial_schema')
			ON CONFLICT DO NOTHING;
		`);
		console.log('  ✓ _migrations');
		
		await client.query('COMMIT');
		
		console.log(colors.green('\n✅ Migration erfolgreich abgeschlossen\n'));
		console.log('─'.repeat(50));
		
		// Show summary
		const tablesResult = await client.query(`
			SELECT table_name 
			FROM information_schema.tables 
			WHERE table_schema = 'public' 
			ORDER BY table_name
		`);
		
		console.log(colors.blue('\n📊 Erstellte Tabellen:'));
		tablesResult.rows.forEach(row => {
			console.log(`   • ${row.table_name}`);
		});
		console.log('');
		
	} catch (error) {
		await client.query('ROLLBACK');
		console.error(colors.red('\n❌ Migration fehlgeschlagen:'), error.message);
		process.exit(1);
	} finally {
		client.release();
		await pool.end();
	}
}

migrate();
