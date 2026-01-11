/**
 * Artellico - Theme Store (Simplified)
 * 
 * The blocking script in app.html handles initial theme application.
 * This store only manages user interactions AFTER hydration.
 */

import { browser } from '$app/environment';
import type { Theme } from '$lib/types';

const STORAGE_KEY = 'artellico_theme';

function getSystemPrefersDark(): boolean {
	if (!browser) return false;
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function isDarkModeActive(): boolean {
	if (!browser) return false;
	return document.documentElement.classList.contains('dark');
}

function setDarkMode(dark: boolean): void {
	if (!browser) return;
	if (dark) {
		document.documentElement.classList.add('dark');
	} else {
		document.documentElement.classList.remove('dark');
	}
}

function saveTheme(theme: Theme): void {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, theme);
}

function loadTheme(): Theme {
	if (!browser) return 'auto';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'light' || stored === 'dark' || stored === 'auto') {
		return stored;
	}
	return 'auto';
}

export function createTheme() {
	// Initialize from localStorage (or 'auto' if not set)
	const storedTheme = loadTheme();
	
	// State: user's preference (light/dark/auto)
	let theme = $state<Theme>(storedTheme);
	
	// State: what's currently displayed - READ FROM DOM on client
	// This ensures we match what the blocking script set
	let _isDark = $state<boolean>(false);
	
	// On mount (client only), sync _isDark with actual DOM state
	$effect(() => {
		if (browser) {
			_isDark = isDarkModeActive();
		}
	});
	
	// Listen for system preference changes (only matters when theme === 'auto')
	$effect(() => {
		if (!browser) return;
		if (theme !== 'auto') return;
		
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = (e: MediaQueryListEvent) => {
			_isDark = e.matches;
			setDarkMode(e.matches);
		};
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});
	
	function setTheme(newTheme: Theme): void {
		theme = newTheme;
		saveTheme(newTheme);
		
		// Apply immediately
		let shouldBeDark: boolean;
		if (newTheme === 'auto') {
			shouldBeDark = getSystemPrefersDark();
		} else {
			shouldBeDark = newTheme === 'dark';
		}
		
		_isDark = shouldBeDark;
		setDarkMode(shouldBeDark);
	}
	
	function toggleTheme(): void {
		// Toggle based on current visual state
		const newDark = !_isDark;
		setTheme(newDark ? 'dark' : 'light');
	}
	
	return {
		get theme() { return theme; },
		set theme(t: Theme) { setTheme(t); },
		get effectiveTheme(): 'light' | 'dark' { return _isDark ? 'dark' : 'light'; },
		get isDark() { return _isDark; },
		setTheme,
		toggleTheme,
	};
}

// Reading Mode (unchanged)
const READING_MODE_KEY = 'artellico_reading_mode';

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
