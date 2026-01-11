/**
 * Artellico - Server Hooks
 * 
 * Central session validation and route protection.
 * All requests pass through this hook.
 */

import type { Handle } from '@sveltejs/kit';
import { validateSession, refreshSession, SESSION_COOKIE_NAME } from '$lib/server/session';

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
	'/editor',
	'/settings',
	'/literatur',
	'/api',
];

/**
 * Auth routes (redirect to home if already authenticated)
 */
const AUTH_ROUTES = [
	'/auth',
];

/**
 * Main request handler
 */
export const handle: Handle = async ({ event, resolve }) => {
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
	
	// Redirect authenticated users away from auth pages
	if (AUTH_ROUTES.some(route => path.startsWith(route)) && event.locals.user) {
		return new Response(null, {
			status: 302,
			headers: { Location: '/' },
		});
	}
	
	// Protect authenticated routes
	if (PROTECTED_ROUTES.some(route => path.startsWith(route)) && !event.locals.user) {
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
