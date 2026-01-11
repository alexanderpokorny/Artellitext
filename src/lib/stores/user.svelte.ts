/**
 * Artellico - User Store
 * 
 * Manages authenticated user state and session data.
 */

import type { SessionUser, FeatureFlags } from '$lib/types';

// ===========================================
// USER STATE
// ===========================================

/**
 * Create user state with Svelte 5 runes.
 */
export function createUserState(initialUser?: SessionUser | null) {
	let user = $state<SessionUser | null>(initialUser || null);
	
	// Derived authentication state
	let isAuthenticated = $derived<boolean>(user !== null);
	let isAdmin = $derived<boolean>(user?.role === 'admin' || user?.role === 'superadmin');
	let isSuperAdmin = $derived<boolean>(user?.role === 'superadmin');
	
	function setUser(newUser: SessionUser | null): void {
		user = newUser;
	}
	
	function clearUser(): void {
		user = null;
	}
	
	return {
		get user() { return user; },
		set user(u: SessionUser | null) { setUser(u); },
		get isAuthenticated() { return isAuthenticated; },
		get isAdmin() { return isAdmin; },
		get isSuperAdmin() { return isSuperAdmin; },
		setUser,
		clearUser,
	};
}

// ===========================================
// FEATURE ACCESS
// ===========================================

import { TIER_FEATURES as tierFeatures } from '$lib/types';

/**
 * Check if a user has access to a specific feature.
 */
export function hasFeature(user: SessionUser | null, feature: keyof FeatureFlags): boolean {
	if (!user) return false;
	
	const features = tierFeatures[user.subscriptionTier];
	return features?.[feature] ?? false;
}

/**
 * Get all features available to a user.
 */
export function getUserFeatures(user: SessionUser | null): FeatureFlags {
	if (!user) {
		return tierFeatures.free;
	}
	return tierFeatures[user.subscriptionTier];
}
