/**
 * Artellico - Editor Page Server Load (Existing Note)
 * 
 * Loads an existing note for editing.
 */

import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { queryOne } from '$lib/server/db';
import type { SessionUser } from '$lib/types';

export const load: PageServerLoad = async ({ parent, params }) => {
	const parentData = await parent();
	const user = parentData.user as SessionUser | null;
	
	// If not logged in, redirect to auth
	if (!user) {
		throw redirect(302, '/auth');
	}
	
	const { id } = params;
	
	try {
		const note = await queryOne(
			`SELECT id, title, content, tags, word_count, reading_time, 
			        created_at, updated_at
			 FROM notes 
			 WHERE id = $1 AND user_id = $2`,
			[id, user.id]
		);
		
		if (!note) {
			throw error(404, 'Note not found');
		}
		
		return {
			note,
		};
	} catch (err: any) {
		if (err.status === 404) {
			throw err;
		}
		console.error('Error loading note:', err);
		throw error(500, 'Failed to load note');
	}
};
