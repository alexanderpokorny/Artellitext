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
	
	// Reactive theme state
	let theme = $state<Theme>(initialTheme);
	
	// Derived effective theme (what's actually displayed)
	let effectiveTheme = $derived<'light' | 'dark'>(
		theme === 'auto' ? getSystemTheme() : theme
	);
	
	// Track if this is the initial mount - we don't want to re-apply
	// the theme on mount because the blocking script already did it
	let isInitialMount = true;
	
	// Apply theme whenever it changes (but NOT on initial mount)
	$effect(() => {
		// Read theme to establish dependency
		const currentTheme = theme;
		
		if (isInitialMount) {
			isInitialMount = false;
			return; // Don't re-apply - blocking script already set it
		}
		
		applyTheme(currentTheme);
	});
	
	// Listen for system theme changes when in auto mode
	$effect(() => {
		if (!browser || theme !== 'auto') return;
		
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = () => applyTheme('auto');
		
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
