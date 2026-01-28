/**
 * Artellico - Dashboard Page Server Load
 */

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { query } from '$lib/server/db';
import type { SessionUser } from '$lib/types';

export const load: PageServerLoad = async ({ parent }) => {
	const parentData = await parent();
	const user = parentData.user as SessionUser | null;
	
	// If not logged in, redirect to auth
	if (!user) {
		throw redirect(302, '/auth');
	}
	
	// Fetch recent notes for the user (with full content for excerpts)
	try {
		const notesResult = await query(
			`SELECT id, title, content, tags, word_count, updated_at, created_at
			 FROM notes 
			 WHERE user_id = $1 
			 ORDER BY updated_at DESC 
			 LIMIT 12`,
			[user.id]
		);
		
		return {
			recentNotes: notesResult.rows.map(row => ({
				...row,
				excerpt: null, // Will be computed client-side from content
			})),
		};
	} catch (err) {
		// Database might not be initialized yet
		console.error('Dashboard load error:', err);
		return {
			recentNotes: [],
		};
	}
};
