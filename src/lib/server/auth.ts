/**
 * Artellico - Authentication Utilities
 * 
 * Password hashing, user creation, and authentication logic.
 */

import { query, queryOne, transaction } from './db';
import { createSession, deleteSession } from './session';
import type { User, SessionUser, UserSettings } from '$lib/types';
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// ===========================================
// PASSWORD HASHING
// ===========================================

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

/**
 * Hash a password using scrypt.
 * Returns format: salt:hash
 */
export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(SALT_BYTES).toString('hex');
	const hash = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
	return `${salt}:${hash.toString('hex')}`;
}

/**
 * Verify a password against a stored hash.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	const [salt, hash] = storedHash.split(':');
	
	if (!salt || !hash) {
		return false;
	}
	
	const hashBuffer = Buffer.from(hash, 'hex');
	const suppliedHash = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
	
	return timingSafeEqual(hashBuffer, suppliedHash);
}

// ===========================================
// USER OPERATIONS
// ===========================================

/**
 * Default user settings for new accounts.
 */
const DEFAULT_USER_SETTINGS: UserSettings = {
	cacheLimit: 100,
	enableGeolocation: false,
	defaultCitationFormat: 'apa',
	autoSaveInterval: 30,
	editorFontSize: 18,
	readingModeEnabled: false,
	apiKeys: {},
};

/**
 * Create a new user account.
 * 
 * @param email - User email
 * @param username - Unique username
 * @param password - Plain text password (will be hashed)
 * @param displayName - Optional display name
 * @returns Created user (without password hash)
 */
export async function createUser(
	email: string,
	username: string,
	password: string,
	displayName?: string
): Promise<Omit<User, 'settings'> & { settings: UserSettings }> {
	// Check if email or username already exists
	const existing = await queryOne<{ id: string }>(
		'SELECT id FROM users WHERE email = $1 OR username = $2',
		[email.toLowerCase(), username.toLowerCase()]
	);
	
	if (existing) {
		throw new Error('Email or username already exists');
	}
	
	const passwordHash = await hashPassword(password);
	
	const result = await queryOne<User>(
		`
		INSERT INTO users (email, username, password_hash, display_name, settings)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING 
			id, 
			email, 
			username, 
			display_name as "displayName",
			avatar_url as "avatarUrl",
			role,
			subscription_tier as "subscriptionTier",
			language,
			theme,
			email_verified as "emailVerified",
			settings,
			created_at as "createdAt",
			updated_at as "updatedAt"
		`,
		[
			email.toLowerCase(),
			username.toLowerCase(),
			passwordHash,
			displayName || username,
			JSON.stringify(DEFAULT_USER_SETTINGS),
		]
	);
	
	if (!result) {
		throw new Error('Failed to create user');
	}
	
	return result;
}

/**
 * Authenticate a user with email/username and password.
 * 
 * @param identifier - Email or username
 * @param password - Plain text password
 * @returns User data if authentication successful, null otherwise
 */
export async function authenticateUser(
	identifier: string,
	password: string
): Promise<User | null> {
	const user = await queryOne<User & { password_hash: string }>(
		`
		SELECT 
			id, 
			email, 
			username, 
			password_hash,
			display_name as "displayName",
			avatar_url as "avatarUrl",
			role,
			subscription_tier as "subscriptionTier",
			language,
			theme,
			email_verified as "emailVerified",
			settings,
			created_at as "createdAt",
			updated_at as "updatedAt"
		FROM users 
		WHERE email = $1 OR username = $1
		`,
		[identifier.toLowerCase()]
	);
	
	if (!user) {
		return null;
	}
	
	const isValid = await verifyPassword(password, user.password_hash);
	
	if (!isValid) {
		return null;
	}
	
	// Return user without password hash
	const { password_hash, ...userWithoutPassword } = user;
	return userWithoutPassword;
}

/**
 * Get a user by ID.
 */
export async function getUserById(id: string): Promise<User | null> {
	return queryOne<User>(
		`
		SELECT 
			id, 
			email, 
			username, 
			display_name as "displayName",
			avatar_url as "avatarUrl",
			role,
			subscription_tier as "subscriptionTier",
			language,
			theme,
			email_verified as "emailVerified",
			settings,
			created_at as "createdAt",
			updated_at as "updatedAt"
		FROM users 
		WHERE id = $1
		`,
		[id]
	);
}

/**
 * Update user profile.
 */
export async function updateUserProfile(
	userId: string,
	updates: Partial<Pick<User, 'displayName' | 'avatarUrl' | 'language' | 'theme'>>
): Promise<User | null> {
	const setClauses: string[] = [];
	const values: unknown[] = [];
	let paramIndex = 1;
	
	if (updates.displayName !== undefined) {
		setClauses.push(`display_name = $${paramIndex++}`);
		values.push(updates.displayName);
	}
	if (updates.avatarUrl !== undefined) {
		setClauses.push(`avatar_url = $${paramIndex++}`);
		values.push(updates.avatarUrl);
	}
	if (updates.language !== undefined) {
		setClauses.push(`language = $${paramIndex++}`);
		values.push(updates.language);
	}
	if (updates.theme !== undefined) {
		setClauses.push(`theme = $${paramIndex++}`);
		values.push(updates.theme);
	}
	
	if (setClauses.length === 0) {
		return getUserById(userId);
	}
	
	values.push(userId);
	
	return queryOne<User>(
		`
		UPDATE users 
		SET ${setClauses.join(', ')}
		WHERE id = $${paramIndex}
		RETURNING 
			id, 
			email, 
			username, 
			display_name as "displayName",
			avatar_url as "avatarUrl",
			role,
			subscription_tier as "subscriptionTier",
			language,
			theme,
			email_verified as "emailVerified",
			settings,
			created_at as "createdAt",
			updated_at as "updatedAt"
		`,
		values
	);
}

/**
 * Update user settings.
 */
export async function updateUserSettings(
	userId: string,
	settings: Partial<UserSettings>
): Promise<UserSettings> {
	const result = await queryOne<{ settings: UserSettings }>(
		`
		UPDATE users 
		SET settings = settings || $1::jsonb
		WHERE id = $2
		RETURNING settings
		`,
		[JSON.stringify(settings), userId]
	);
	
	return result?.settings || DEFAULT_USER_SETTINGS;
}

/**
 * Change user password.
 */
export async function changePassword(
	userId: string,
	currentPassword: string,
	newPassword: string
): Promise<boolean> {
	const user = await queryOne<{ password_hash: string }>(
		'SELECT password_hash FROM users WHERE id = $1',
		[userId]
	);
	
	if (!user) {
		return false;
	}
	
	const isValid = await verifyPassword(currentPassword, user.password_hash);
	
	if (!isValid) {
		return false;
	}
	
	const newHash = await hashPassword(newPassword);
	
	await query(
		'UPDATE users SET password_hash = $1 WHERE id = $2',
		[newHash, userId]
	);
	
	return true;
}

/**
 * Delete a user account and all associated data.
 * Implements GDPR Article 17 (Right to Erasure).
 */
export async function deleteUser(userId: string): Promise<void> {
	await transaction(async (client) => {
		// Sessions are deleted via CASCADE
		// Notes are deleted via CASCADE
		// Documents are deleted via CASCADE
		
		// Delete the user (cascades to all related data)
		await client.query('DELETE FROM users WHERE id = $1', [userId]);
	});
}

// ===========================================
// LOGIN / LOGOUT HELPERS
// ===========================================

/**
 * Login and create a session cookie.
 * Returns the session token for setting in cookies.
 */
export async function login(
	identifier: string,
	password: string,
	userAgent?: string,
	ipAddress?: string
): Promise<{ user: SessionUser; token: string } | null> {
	const user = await authenticateUser(identifier, password);
	
	if (!user) {
		return null;
	}
	
	const { token } = await createSession(user.id, userAgent, ipAddress);
	
	const sessionUser: SessionUser = {
		id: user.id,
		email: user.email,
		username: user.username,
		displayName: user.displayName,
		avatarUrl: user.avatarUrl,
		role: user.role,
		subscriptionTier: user.subscriptionTier,
	};
	
	return { user: sessionUser, token };
}

/**
 * Logout by deleting the session.
 */
export async function logout(token: string): Promise<void> {
	await deleteSession(token);
}
