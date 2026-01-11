/**
 * Artellico - Logout Action
 */

import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { logout } from '$lib/server/auth';
import { SESSION_COOKIE_NAME } from '$lib/server/session';

export const actions: Actions = {
	default: async ({ cookies }) => {
		const token = cookies.get(SESSION_COOKIE_NAME);
		
		if (token) {
			await logout(token);
			cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		}
		
		throw redirect(302, '/auth');
	},
};
