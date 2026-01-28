/**
 * Artellico - App.d.ts Type Declarations
 * 
 * SvelteKit type augmentations for locals and platform.
 */

import type { SessionUser, Session } from '$lib/types';

// Module declarations for packages without types
declare module 'editorjs-drag-drop';

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
