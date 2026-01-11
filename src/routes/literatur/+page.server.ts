/**
 * Artellico - Literature Page Server Load
 */

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	
	// Require authentication
	if (!user) {
		throw redirect(302, '/auth');
	}
	
	// Would fetch documents here
	return {
		documents: [],
	};
};
