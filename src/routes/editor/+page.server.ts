/**
 * Artellico - Editor Page Server Load
 */

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	
	// Require authentication for editor
	if (!user) {
		throw redirect(302, '/auth');
	}
	
	return {
		note: null, // New note
	};
};
