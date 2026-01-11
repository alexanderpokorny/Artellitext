/**
 * Artellico - Theme Store
 * 
 * Manages theme state (light/dark/auto) with system preference detection.
 * 
 * IMPORTANT: The initial theme is applied by a blocking script in app.html
 * to prevent flash. This store syncs with that initial value.
 */

import { browser } from '$app/environment';
import type { Theme } from '$lib/types';

// ===========================================
// CONFIGURATION
// ===========================================

const STORAGE_KEY = 'artellico_theme';
const DEFAULT_THEME: Theme = 'auto';

// ===========================================
// SYSTEM PREFERENCE DETECTION
// ===========================================

/**
 * Get the system's color scheme preference.
 */
export function getSystemTheme(): 'light' | 'dark' {
	if (!browser) return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Get the current theme from DOM (set by blocking script in app.html).
 * This is the source of truth on initial load.
 */
export function getCurrentDOMTheme(): 'light' | 'dark' {
	if (!browser) return 'light';
	return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Get the stored theme preference.
 */
export function getStoredTheme(): Theme | null {
	if (!browser) return null;
	const stored = localStorage.getItem(STORAGE_KEY) as Theme;
	return ['light', 'dark', 'auto'].includes(stored) ? stored : null;
}

/**
 * Store the theme preference.
 */
export function setStoredTheme(theme: Theme): void {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * Apply theme to document using CSS class (not data-attribute).
 * The 'dark' class is added/removed on the html element.
 * 
 * IMPORTANT: Only call this when the user explicitly changes the theme,
 * NOT on initial mount (blocking script in app.html handles that).
 */
export function applyTheme(theme: Theme): void {
	if (!browser) return;
	
	const effectiveTheme = theme === 'auto' ? getSystemTheme() : theme;
	const hasDarkClass = document.documentElement.classList.contains('dark');
	
	// Only modify if actually different (prevents unnecessary reflows)
	if (effectiveTheme === 'dark' && !hasDarkClass) {
		document.documentElement.classList.add('dark');
	} else if (effectiveTheme === 'light' && hasDarkClass) {
		document.documentElement.classList.remove('dark');
	}
	
	// Update meta theme-color for mobile browsers
	const metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])');
	if (metaThemeColor) {
		metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#0a0a0a' : '#f5f5f5');
	}
}

// ===========================================
// SVELTE 5 RUNES-BASED THEME STATE
// ===========================================

/**
 * Create theme state with Svelte 5 runes.
 */
export function createTheme(initial?: Theme) {
	// Get stored theme preference (user's choice: light, dark, or auto)
	const storedTheme = getStoredTheme();
	const initialTheme = initial || storedTheme || DEFAULT_THEME;
	
	// CRITICAL: Get the current DOM state set by blocking script
	// This is the source of truth for initial effectiveTheme
	const initialEffective = getCurrentDOMTheme();
	
	// Reactive theme state (user's preference: light, dark, or auto)
	let theme = $state<Theme>(initialTheme);
	
	// Track the effective theme (what's actually displayed)
	// Initialize from DOM, not from computed value!
	let _effectiveTheme = $state<'light' | 'dark'>(initialEffective);
	
	// Update effective theme when theme changes (after initial mount)
	let isInitialMount = true;
	
	$effect(() => {
		const currentTheme = theme;
		
		if (isInitialMount) {
			isInitialMount = false;
			return;
		}
		
		// Calculate and apply new effective theme
		const newEffective = currentTheme === 'auto' ? getSystemTheme() : currentTheme;
		_effectiveTheme = newEffective;
		applyTheme(currentTheme);
	});
	
	// Listen for system theme changes when in auto mode
	$effect(() => {
		if (!browser || theme !== 'auto') return;
		
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		
		const handler = (e: MediaQueryListEvent) => {
			_effectiveTheme = e.matches ? 'dark' : 'light';
			applyTheme('auto');
		};
			applyTheme('auto');
		};
		
		mediaQuery.addEventListener('change', handler);
		return () => mediaQuery.removeEventListener('change', handler);
	});
	
	function setTheme(newTheme: Theme): void {
		theme = newTheme;
		setStoredTheme(newTheme);
		applyTheme(newTheme);
	}
	
	function toggleTheme(): void {
		// Toggle between light and dark (bypassing auto)
		const next: Theme = effectiveTheme === 'light' ? 'dark' : 'light';
		setTheme(next);
	}
	
	return {
		get theme() { return theme; },
		set theme(t: Theme) { setTheme(t); },
		get effectiveTheme() { return effectiveTheme; },
		setTheme,
		toggleTheme,
	};
}

// ===========================================
// READING MODE
// ===========================================

const READING_MODE_KEY = 'artellico_reading_mode';

/**
 * Create reading mode state.
 */
export function createReadingMode() {
	const stored = browser ? localStorage.getItem(READING_MODE_KEY) === 'true' : false;
	
	let enabled = $state<boolean>(stored);
	
	$effect(() => {
		if (!browser) return;
		
		document.documentElement.setAttribute('data-reading-mode', String(enabled));
		localStorage.setItem(READING_MODE_KEY, String(enabled));
	});
	
	function toggle(): void {
		enabled = !enabled;
	}
	
	return {
		get enabled() { return enabled; },
		set enabled(v: boolean) { enabled = v; },
		toggle,
	};
}
