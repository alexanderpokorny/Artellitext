/**
 * Artellico - Settings Page Server Load & Actions
 */

import type { PageServerLoad, Actions } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	
	// Require authentication
	if (!user) {
		throw redirect(302, '/auth');
	}
	
	return {};
};

export const actions: Actions = {
	updateProfile: async ({ request }) => {
		const data = await request.formData();
		// TODO: Implement profile update
		void data.get('displayName');
		void data.get('citationFormat');
		
		return { success: true };
	},
	
	updateAppearance: async ({ request }) => {
		const data = await request.formData();
		// TODO: Implement appearance update
		void data.get('theme');
		void data.get('language');
		
		return { success: true };
	},
	
	updateCache: async ({ request }) => {
		const data = await request.formData();
		// TODO: Implement cache settings update
		void data.get('cacheLimit');
		void data.get('enableGeolocation');
		
		return { success: true };
	},
	
	updateApiKeys: async ({ request }) => {
		const data = await request.formData();
		// TODO: Implement API key storage
		void data.get('openrouterKey');
		void data.get('openaiKey');
		
		return { success: true };
	},
};
