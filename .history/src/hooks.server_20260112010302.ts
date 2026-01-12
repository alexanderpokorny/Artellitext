/**
 * Artellico - Server Hooks
 * 
 * Central session validation and route protection.
 * All requests pass through this hook.
 */

import type { Handle } from '@sveltejs/kit';
import { validateSession, refreshSession, SESSION_COOKIE_NAME } from '$lib/server/session';
import { initializeDatabase } from '$lib/server/db';

// Initialize database on server startup (runs once)
let dbInitialized = false;
async function ensureDbInitialized() {
	if (!dbInitialized) {
		try {
			await initializeDatabase();
			dbInitialized = true;
		} catch (error) {
			console.error('[Server] Database initialization failed:', error);
			// Continue anyway - tables might already exist
			dbInitialized = true;
		}
	}
}

/**
 * Protected routes that require authentication AND valid subscription
 */
const PROTECTED_ROUTES = [
	'/',
	'/editor',
	'/settings',
	'/literatur',
	'/api',
];

/**
 * Routes that require authentication but NOT subscription check
 * (e.g., subscription management, account settings)
 */
const AUTH_ONLY_ROUTES = [
	'/settings/subscription',
	'/settings/account',
];

/**
 * Auth routes (redirect to home if already authenticated with valid subscription)
 */
const AUTH_ROUTES = [
	'/auth',
];

/**
 * Check if user has a valid subscription
 */
function hasValidSubscription(user: { subscriptionTier: string; subscriptionExpiresAt: Date | null }): boolean {
	// Lifetime subscription never expires
	if (user.subscriptionTier === 'lifetime') {
		return true;
	}
	
	// Free tier is always valid (with limitations handled elsewhere)
	if (user.subscriptionTier === 'free') {
		return true;
	}
	
	// Paid tiers require valid expiration date
	if (!user.subscriptionExpiresAt) {
		return false;
	}
	
	return new Date(user.subscriptionExpiresAt) > new Date();
}

/**
 * Main request handler
 */
export const handle: Handle = async ({ event, resolve }) => {
	// Ensure database is initialized
	await ensureDbInitialized();
	
	// Get session token from cookie
	const sessionToken = event.cookies.get(SESSION_COOKIE_NAME);
	
	// Initialize locals
	event.locals.user = null;
	event.locals.session = null;
	
	// Validate session if token exists
	if (sessionToken) {
		const validatedSession = await validateSession(sessionToken);
		
		if (validatedSession) {
			// Check if session needs refresh (within 7 days of expiry)
			const sevenDays = 7 * 24 * 60 * 60 * 1000;
			const shouldRefresh = validatedSession.expiresAt.getTime() - Date.now() < sevenDays;
			
			if (shouldRefresh) {
				await refreshSession(sessionToken);
			}
			
			event.locals.user = validatedSession.user;
		} else {
			// Invalid session - clear cookie
			event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		}
	}
	
	// Check route protection
	const path = event.url.pathname;
	
	// Helper to check if path matches protected routes
	// For '/' we need exact match, for others we use startsWith
	const isProtectedRoute = (routePath: string) => {
		return PROTECTED_ROUTES.some(route => {
			if (route === '/') return routePath === '/';
			return routePath.startsWith(route);
		});
	};
	
	// Redirect authenticated users with valid subscription away from auth pages
	if (AUTH_ROUTES.some(route => path.startsWith(route)) && event.locals.user) {
		if (hasValidSubscription(event.locals.user)) {
			return new Response(null, {
				status: 302,
				headers: { Location: '/' },
			});
		}
	}
	
	// Check if route is auth-only (no subscription check)
	const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some(route => path.startsWith(route));
	
	// Protect authenticated routes
	if (isProtectedRoute(path) && !event.locals.user) {
		// Skip auth routes
		if (AUTH_ROUTES.some(route => path.startsWith(route))) {
			// Don't redirect auth pages
		} else {
			// For API routes, return 401
			if (path.startsWith('/api')) {
				return new Response(
					JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
					{
						status: 401,
						headers: { 'Content-Type': 'application/json' },
					}
				);
			}
			
			// For page routes, redirect to auth with return URL
			const returnUrl = encodeURIComponent(path);
			return new Response(null, {
				status: 302,
				headers: { Location: `/auth?returnUrl=${returnUrl}` },
			});
		}
	}
	
	// Check subscription for protected routes (not auth-only routes)
	if (event.locals.user && !isAuthOnlyRoute && PROTECTED_ROUTES.some(route => path.startsWith(route))) {
		if (!hasValidSubscription(event.locals.user)) {
			// For API routes, return 403
			if (path.startsWith('/api')) {
				return new Response(
					JSON.stringify({ error: 'Forbidden', message: 'Valid subscription required' }),
					{
						status: 403,
						headers: { 'Content-Type': 'application/json' },
					}
				);
			}
			
			// For page routes, redirect to auth with error
			return new Response(null, {
				status: 302,
				headers: { Location: '/auth?error=subscription_expired' },
			});
		}
	}
	
	// Continue to route handler
	const response = await resolve(event);
	
	// Add security headers
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: addSecurityHeaders(response.headers),
	});
};

/**
 * Add security headers to response
 */
function addSecurityHeaders(headers: Headers): Headers {
	const newHeaders = new Headers(headers);
	
	// Prevent clickjacking
	if (!newHeaders.has('X-Frame-Options')) {
		newHeaders.set('X-Frame-Options', 'SAMEORIGIN');
	}
	
	// Prevent MIME sniffing
	if (!newHeaders.has('X-Content-Type-Options')) {
		newHeaders.set('X-Content-Type-Options', 'nosniff');
	}
	
	// XSS Protection (legacy, but doesn't hurt)
	if (!newHeaders.has('X-XSS-Protection')) {
		newHeaders.set('X-XSS-Protection', '1; mode=block');
	}
	
	// Referrer policy
	if (!newHeaders.has('Referrer-Policy')) {
		newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	}
	
	return newHeaders;
}
