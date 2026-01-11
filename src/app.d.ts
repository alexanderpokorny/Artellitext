/**
 * Artellico - App.d.ts Type Declarations
 * 
 * SvelteKit type augmentations for locals and platform.
 */

import type { SessionUser, Session } from '$lib/types';

declare global {
	namespace App {
		interface Locals {
			user: SessionUser | null;
			session: Session | null;
		}
		
		interface PageData {
			user: SessionUser | null;
		}
		
		interface Error {
			message: string;
			code?: string;
		}
		
		// interface Platform {}
	}
}

export {};
