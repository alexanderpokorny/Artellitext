/**
 * Artellico - Layout Server Load Function
 * 
 * Provides session data and user information to all routes.
 */

import type { LayoutServerLoad } from './$types';
import { validateSession, SESSION_COOKIE_NAME } from '$lib/server/session';
import { query } from '$lib/server/db';
import { getStorageUsage } from '$lib/server/storage';
import type { SessionUser } from '$lib/types';

interface LayoutStats {
	notes: number;
	documents: number;
	storageBytes: number;
}

export const load: LayoutServerLoad = async ({ cookies, url }): Promise<{ 
	user: SessionUser | null; 
	url: string;
	stats: LayoutStats | null;
}> => {
	const sessionToken = cookies.get(SESSION_COOKIE_NAME);
	
	let user: SessionUser | null = null;
	let stats: LayoutStats | null = null;
	
	if (sessionToken) {
		const session = await validateSession(sessionToken);
		
		// If session is invalid, clear the cookie
		if (!session) {
			cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		} else {
			user = session.user;
			
			// Load user stats for footer display
			try {
				const statsResult = await query(
					`SELECT 
						(SELECT COUNT(*) FROM notes WHERE user_id = $1) as note_count,
						(SELECT COUNT(*) FROM documents WHERE user_id = $1) as doc_count`,
					[user.id]
				);
				
				const storageBytes = await getStorageUsage(user.id);
				
				stats = {
					notes: parseInt(statsResult.rows[0]?.note_count || '0'),
					documents: parseInt(statsResult.rows[0]?.doc_count || '0'),
					storageBytes,
				};
			} catch (err) {
				console.error('Failed to load user stats:', err);
				stats = { notes: 0, documents: 0, storageBytes: 0 };
			}
		}
	}
	
	return {
		user,
		url: url.pathname,
		stats,
	};
};
