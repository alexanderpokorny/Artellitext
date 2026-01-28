/**
 * Artellico - New Note Page Server Load
 * 
 * Redirects to /editor, which serves as both new note editor and existing note editor.
 */

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	
	// Require authentication
	if (!user) {
		throw redirect(302, '/auth');
	}
	
	// Redirect to the editor page (which already handles new notes)
	throw redirect(302, '/editor');
};
