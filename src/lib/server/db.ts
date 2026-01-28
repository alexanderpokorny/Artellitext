/**
 * Artellico - Database Connection Pool
 * 
 * PostgreSQL connection with pgvector support for semantic search.
 * Follows repository pattern for clean data access.
 */

import pg from 'pg';
import { env } from '$env/dynamic/private';

const { Pool } = pg;

// ===========================================
// CONNECTION POOL CONFIGURATION
// ===========================================

/**
 * PostgreSQL connection pool with optimized settings
 * for a SvelteKit application.
 */
export const pool = new Pool({
	connectionString: env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/Artellitext',
	max: 20,                    // Maximum connections in pool
	idleTimeoutMillis: 30000,   // Close idle connections after 30s
	connectionTimeoutMillis: 5000, // Fail connection after 5s
	allowExitOnIdle: false,     // Keep pool alive
});

// Log connection errors (but not in production)
pool.on('error', (err) => {
	console.error('[DB] Unexpected error on idle client:', err);
});

// ===========================================
// QUERY HELPER FUNCTIONS
// ===========================================

/**
 * Execute a query with automatic connection handling.
 * 
 * @param text - SQL query string
 * @param params - Query parameters
 * @returns Query result
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
	text: string,
	params?: unknown[]
): Promise<pg.QueryResult<T>> {
	const start = Date.now();
	
	try {
		const result = await pool.query<T>(text, params);
		const duration = Date.now() - start;
		
		// Log slow queries in development
		if (duration > 100) {
			console.warn(`[DB] Slow query (${duration}ms):`, text.substring(0, 100));
		}
		
		return result;
	} catch (error) {
		console.error('[DB] Query error:', error);
		throw error;
	}
}

/**
 * Get a single row from a query.
 * 
 * @param text - SQL query string
 * @param params - Query parameters
 * @returns Single row or null
 */
export async function queryOne<T extends pg.QueryResultRow = pg.QueryResultRow>(
	text: string,
	params?: unknown[]
): Promise<T | null> {
	const result = await query<T>(text, params);
	return result.rows[0] || null;
}

/**
 * Execute multiple queries in a transaction.
 * 
 * @param callback - Function receiving a client for transaction queries
 * @returns Transaction result
 */
export async function transaction<T>(
	callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
	const client = await pool.connect();
	
	try {
		await client.query('BEGIN');
		const result = await callback(client);
		await client.query('COMMIT');
		return result;
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
}

// ===========================================
// DATABASE INITIALIZATION
// ===========================================

/**
 * Initialize database schema and extensions.
 * Should be run once on application startup.
 */
export async function initializeDatabase(): Promise<void> {
	console.log('[DB] Initializing database...');
	
	try {
		// Enable pgvector extension for embeddings
		await query(`CREATE EXTENSION IF NOT EXISTS vector;`);
		
		// Create users table
		await query(`
			CREATE TABLE IF NOT EXISTS users (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				email VARCHAR(255) UNIQUE NOT NULL,
				username VARCHAR(50) UNIQUE NOT NULL,
				password_hash VARCHAR(255) NOT NULL,
				display_name VARCHAR(100),
				avatar_url TEXT,
				role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
				subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'team', 'enterprise', 'lifetime')),
				subscription_expires_at TIMESTAMPTZ,
				language VARCHAR(5) DEFAULT 'de' CHECK (language IN ('de', 'en', 'fr', 'es', 'it')),
				theme VARCHAR(10) DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
				email_verified BOOLEAN DEFAULT FALSE,
				settings JSONB DEFAULT '{}'::jsonb,
				created_at TIMESTAMPTZ DEFAULT NOW(),
				updated_at TIMESTAMPTZ DEFAULT NOW()
			);
		`);
		
		// Add subscription_expires_at column if it doesn't exist (migration)
		await query(`
			ALTER TABLE users 
			ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
		`).catch(() => {});
		
		// Update subscription_tier constraint to include 'lifetime'
		await query(`
			ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_tier_check;
			ALTER TABLE users ADD CONSTRAINT users_subscription_tier_check 
				CHECK (subscription_tier IN ('free', 'pro', 'team', 'enterprise', 'lifetime'));
		`).catch(() => {});
		
		// Create sessions table
		await query(`
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
		
		// Create notes table
		await query(`
			CREATE TABLE IF NOT EXISTS notes (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				title VARCHAR(500) NOT NULL,
				content JSONB NOT NULL DEFAULT '{}'::jsonb,
				summary TEXT,
				status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
				tags TEXT[] DEFAULT '{}',
				language VARCHAR(5) DEFAULT 'de' CHECK (language IN ('de', 'en', 'fr', 'es', 'it', 'mu')),
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
		
		// Create documents table
		await query(`
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
				status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error', 'archived')),
				embedding vector(1536),
				created_at TIMESTAMPTZ DEFAULT NOW(),
				updated_at TIMESTAMPTZ DEFAULT NOW()
			);
			
			CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
			CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
			CREATE INDEX IF NOT EXISTS idx_documents_mime ON documents(mime_type);
			CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC);
		`);
		
		// Create vector similarity search indexes (using HNSW for better performance)
		await query(`
			CREATE INDEX IF NOT EXISTS idx_notes_embedding ON notes 
			USING hnsw (embedding vector_cosine_ops) 
			WITH (m = 16, ef_construction = 64);
		`).catch(() => {
			// HNSW might not be available in older pgvector versions
			console.warn('[DB] HNSW index not available, using IVFFlat');
		});
		
		await query(`
			CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents 
			USING hnsw (embedding vector_cosine_ops) 
			WITH (m = 16, ef_construction = 64);
		`).catch(() => {
			// Fallback silently
		});
		
		// Create updated_at trigger function
		await query(`
			CREATE OR REPLACE FUNCTION update_updated_at_column()
			RETURNS TRIGGER AS $$
			BEGIN
				NEW.updated_at = NOW();
				RETURN NEW;
			END;
			$$ language 'plpgsql';
		`);
		
		// Apply triggers to tables - use DO block to avoid deadlocks with parallel requests
		await query(`
			DO $$
			BEGIN
				-- Users trigger
				DROP TRIGGER IF EXISTS update_users_updated_at ON users;
				CREATE TRIGGER update_users_updated_at
					BEFORE UPDATE ON users
					FOR EACH ROW
					EXECUTE FUNCTION update_updated_at_column();
				
				-- Notes trigger
				DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
				CREATE TRIGGER update_notes_updated_at
					BEFORE UPDATE ON notes
					FOR EACH ROW
					EXECUTE FUNCTION update_updated_at_column();
				
				-- Documents trigger
				DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
				CREATE TRIGGER update_documents_updated_at
					BEFORE UPDATE ON documents
					FOR EACH ROW
					EXECUTE FUNCTION update_updated_at_column();
			END;
			$$;
		`);
		
		console.log('[DB] Database initialized successfully');
	} catch (error) {
		console.error('[DB] Failed to initialize database:', error);
		throw error;
	}
}

// ===========================================
// VECTOR SEARCH HELPERS (pgvector)
// ===========================================

/**
 * Find similar notes using vector similarity search.
 * Requires notes to have embeddings generated.
 * 
 * @param embedding - Query embedding vector
 * @param userId - User ID to scope search
 * @param limit - Maximum results to return
 * @returns Similar notes with similarity score
 */
export async function findSimilarNotes(
	embedding: number[],
	userId: string,
	limit: number = 10
): Promise<{ id: string; title: string; similarity: number }[]> {
	const result = await query<{ id: string; title: string; similarity: number }>(
		`
		SELECT 
			id, 
			title, 
			1 - (embedding <=> $1::vector) as similarity
		FROM notes
		WHERE user_id = $2
			AND embedding IS NOT NULL
			AND status != 'archived'
		ORDER BY embedding <=> $1::vector
		LIMIT $3
		`,
		[`[${embedding.join(',')}]`, userId, limit]
	);
	
	return result.rows;
}

/**
 * Find similar documents using vector similarity search.
 * 
 * @param embedding - Query embedding vector
 * @param userId - User ID to scope search
 * @param limit - Maximum results to return
 * @returns Similar documents with similarity score
 */
export async function findSimilarDocuments(
	embedding: number[],
	userId: string,
	limit: number = 10
): Promise<{ id: string; title: string; similarity: number }[]> {
	const result = await query<{ id: string; title: string; similarity: number }>(
		`
		SELECT 
			id, 
			title, 
			1 - (embedding <=> $1::vector) as similarity
		FROM documents
		WHERE user_id = $2
			AND embedding IS NOT NULL
			AND status = 'ready'
		ORDER BY embedding <=> $1::vector
		LIMIT $3
		`,
		[`[${embedding.join(',')}]`, userId, limit]
	);
	
	return result.rows;
}

// ===========================================
// CLEANUP
// ===========================================

/**
 * Close all pool connections gracefully.
 * Call this on application shutdown.
 */
export async function closePool(): Promise<void> {
	await pool.end();
	console.log('[DB] Connection pool closed');
}
