/**
 * Artellico - Layout Server Load Function
 * 
 * Provides session data and user information to all routes.
 */

import type { LayoutServerLoad } from './$types';
import { validateSession, SESSION_COOKIE_NAME } from '$lib/server/session';
import type { SessionUser } from '$lib/types';

export const load: LayoutServerLoad = async ({ cookies, url }): Promise<{ user: SessionUser | null; url: string }> => {
	const sessionToken = cookies.get(SESSION_COOKIE_NAME);
	
	let user: SessionUser | null = null;
	
	if (sessionToken) {
		const session = await validateSession(sessionToken);
		
		// If session is invalid, clear the cookie
		if (!session) {
			cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		} else {
			user = session.user;
		}
	}
	
	return {
		user,
		url: url.pathname,
	};
};
