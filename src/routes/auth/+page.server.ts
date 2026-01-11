/**
 * Artellico - Auth Page Actions
 * 
 * Handles login and registration form submissions.
 */

import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { login, createUser } from '$lib/server/auth';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '$lib/server/session';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	
	// If already logged in, redirect to dashboard
	if (user) {
		throw redirect(302, '/');
	}
	
	return {};
};

export const actions: Actions = {
	login: async ({ request, cookies, getClientAddress }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();
		
		if (!email || !password) {
			return fail(400, { error: 'missing_fields' });
		}
		
		const userAgent = request.headers.get('user-agent') || undefined;
		const ipAddress = getClientAddress();
		
		const result = await login(email, password, userAgent, ipAddress);
		
		if (!result) {
			return fail(401, { error: 'invalid_credentials' });
		}
		
		// Set session cookie
		cookies.set(SESSION_COOKIE_NAME, result.token, SESSION_COOKIE_OPTIONS);
		
		// Redirect to dashboard
		throw redirect(302, '/');
	},
	
	register: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		const username = data.get('username')?.toString();
		const password = data.get('password')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();
		
		if (!email || !username || !password || !confirmPassword) {
			return fail(400, { error: 'missing_fields' });
		}
		
		if (password !== confirmPassword) {
			return fail(400, { error: 'passwords_mismatch' });
		}
		
		if (password.length < 8) {
			return fail(400, { error: 'password_too_short' });
		}
		
		try {
			await createUser(email, username, password);
			return { success: true };
		} catch (error) {
			console.error('Registration error:', error);
			return fail(400, { error: 'registration_failed' });
		}
	},
};
