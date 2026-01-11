/**
 * Artellico - Session Management
 * 
 * Lightweight, secure session handling without heavy dependencies.
 * Sessions are stored in PostgreSQL with automatic cleanup.
 */

import { query, queryOne } from './db';
import type { Session, SessionUser } from '$lib/types';
import { randomBytes, createHash } from 'crypto';

// ===========================================
// CONFIGURATION
// ===========================================

const SESSION_DURATION_DAYS = 30;
const TOKEN_BYTES = 32;

// ===========================================
// TOKEN GENERATION
// ===========================================

/**
 * Generate a cryptographically secure session token.
 */
function generateToken(): string {
	return randomBytes(TOKEN_BYTES).toString('hex');
}

/**
 * Hash a token for secure storage.
 * We store hashed tokens to prevent token theft from database leaks.
 */
function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

// ===========================================
// SESSION OPERATIONS
// ===========================================

/**
 * Create a new session for a user.
 * 
 * @param userId - User ID to create session for
 * @param userAgent - Browser user agent string
 * @param ipAddress - Client IP address
 * @returns Session with unhashed token (for cookie)
 */
export async function createSession(
	userId: string,
	userAgent?: string,
	ipAddress?: string
): Promise<{ session: Session; token: string }> {
	const token = generateToken();
	const hashedToken = hashToken(token);
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);
	
	const result = await queryOne<Session>(
		`
		INSERT INTO sessions (user_id, token, expires_at, user_agent, ip_address)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, user_id as "userId", token, expires_at as "expiresAt", 
		          created_at as "createdAt", user_agent as "userAgent", ip_address as "ipAddress"
		`,
		[userId, hashedToken, expiresAt, userAgent || null, ipAddress || null]
	);
	
	if (!result) {
		throw new Error('Failed to create session');
	}
	
	return { session: result, token };
}

interface ValidatedSession {
	user: SessionUser;
	expiresAt: Date;
}

/**
 * Validate a session token and return the associated user.
 * 
 * @param token - Session token from cookie
 * @returns User data and session info if valid, null otherwise
 */
export async function validateSession(token: string): Promise<ValidatedSession | null> {
	const hashedToken = hashToken(token);
	
	const result = await queryOne<SessionUser & { expires_at: Date }>(
		`
		SELECT 
			u.id,
			u.email,
			u.username,
			u.display_name as "displayName",
			u.avatar_url as "avatarUrl",
			u.role,
			u.subscription_tier as "subscriptionTier",
			s.expires_at
		FROM sessions s
		JOIN users u ON s.user_id = u.id
		WHERE s.token = $1
		`,
		[hashedToken]
	);
	
	if (!result) {
		return null;
	}
	
	const expiresAt = new Date(result.expires_at);
	
	// Check if session has expired
	if (expiresAt < new Date()) {
		await deleteSession(token);
		return null;
	}
	
	// Return user and expiration
	const { expires_at: _expiresAt, ...user } = result;
	return {
		user: user as SessionUser,
		expiresAt,
	};
}

/**
 * Delete a session (logout).
 * 
 * @param token - Session token to invalidate
 */
export async function deleteSession(token: string): Promise<void> {
	const hashedToken = hashToken(token);
	await query('DELETE FROM sessions WHERE token = $1', [hashedToken]);
}

/**
 * Delete all sessions for a user (logout everywhere).
 * 
 * @param userId - User ID to logout
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
	await query('DELETE FROM sessions WHERE user_id = $1', [userId]);
}

/**
 * Refresh a session's expiration time.
 * Call this on active usage to keep sessions alive.
 * 
 * @param token - Session token to refresh
 */
export async function refreshSession(token: string): Promise<void> {
	const hashedToken = hashToken(token);
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);
	
	await query(
		'UPDATE sessions SET expires_at = $1 WHERE token = $2',
		[expiresAt, hashedToken]
	);
}

/**
 * Get all active sessions for a user.
 * Useful for showing "active sessions" in settings.
 * 
 * @param userId - User ID to get sessions for
 */
export async function getUserSessions(userId: string): Promise<Omit<Session, 'token'>[]> {
	const result = await query<Omit<Session, 'token'>>(
		`
		SELECT 
			id,
			user_id as "userId",
			expires_at as "expiresAt",
			created_at as "createdAt",
			user_agent as "userAgent",
			ip_address as "ipAddress"
		FROM sessions
		WHERE user_id = $1
			AND expires_at > NOW()
		ORDER BY created_at DESC
		`,
		[userId]
	);
	
	return result.rows;
}

/**
 * Clean up expired sessions.
 * Should be run periodically (e.g., daily cron job).
 */
export async function cleanupExpiredSessions(): Promise<number> {
	const result = await query(
		'DELETE FROM sessions WHERE expires_at < NOW() RETURNING id'
	);
	
	const deleted = result.rowCount || 0;
	if (deleted > 0) {
		console.log(`[Session] Cleaned up ${deleted} expired sessions`);
	}
	
	return deleted;
}

// ===========================================
// SESSION COOKIE HELPERS
// ===========================================

export const SESSION_COOKIE_NAME = 'artellico_session';

export const SESSION_COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	path: '/',
	maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60, // seconds
};
