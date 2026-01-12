/**
 * Artellico - Theme Store
 * 
 * Manages theme switching between light, dark, high-contrast, and auto modes.
 * The blocking script in static/theme-init.js handles initial theme application.
 * This store manages user interactions AFTER hydration.
 * 
 * WCAG 2.1 AA compliant - High Contrast mode provides AAA compliance.
 */

import { browser } from '$app/environment';
import type { Theme, EffectiveTheme } from '$lib/types';

const STORAGE_KEY = 'artellico_theme';

// All theme classes that can be applied to <html>
const THEME_CLASSES = ['dark', 'high-contrast'] as const;

function getSystemPreference(): EffectiveTheme {
	if (!browser) return 'light';
	
	// Check for high contrast preference first (Windows High Contrast, etc.)
	if (window.matchMedia('(prefers-contrast: more)').matches) {
		return 'high-contrast';
	}
	
	// Then check for dark mode preference
	if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
		return 'dark';
	}
	
	return 'light';
}

function getCurrentThemeFromDOM(): EffectiveTheme {
	if (!browser) return 'light';
	const html = document.documentElement;
	if (html.classList.contains('high-contrast')) return 'high-contrast';
	if (html.classList.contains('dark')) return 'dark';
	return 'light';
}

function applyTheme(effectiveTheme: EffectiveTheme): void {
	if (!browser) return;
	
	const html = document.documentElement;
	
	// Enable transition for smooth theme switch
	html.classList.add('theme-transition');
	
	// Use requestAnimationFrame to ensure transition class is applied before theme change
	requestAnimationFrame(() => {
		// Remove all theme classes
		THEME_CLASSES.forEach(cls => html.classList.remove(cls));
		
		// Apply new theme class (light = no class)
		if (effectiveTheme === 'dark') {
			html.classList.add('dark');
		} else if (effectiveTheme === 'high-contrast') {
			html.classList.add('high-contrast');
		}
		
		// Remove transition class after animation completes
		setTimeout(() => {
			html.classList.remove('theme-transition');
		}, 200);
	});
}

function saveTheme(theme: Theme): void {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, theme);
}

function loadTheme(): Theme {
	if (!browser) return 'light';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'light' || stored === 'dark' || stored === 'high-contrast' || stored === 'auto') {
		return stored;
	}
	return 'light';
}

function resolveTheme(theme: Theme): EffectiveTheme {
	if (theme === 'auto') {
		return getSystemPreference();
	}
	return theme;
}

export function createTheme() {
	// Initialize from localStorage (or 'auto' if not set)
	const storedTheme = loadTheme();
	
	// State: user's preference
	let theme = $state<Theme>(storedTheme);
	
	// State: what's currently displayed (read from DOM on init)
	let _effectiveTheme = $state<EffectiveTheme>(browser ? getCurrentThemeFromDOM() : 'light');
	
	// Listen for system preference changes (only matters when theme === 'auto')
	$effect(() => {
		if (!browser) return;
		if (theme !== 'auto') return;
		
		const darkMq = window.matchMedia('(prefers-color-scheme: dark)');
		const contrastMq = window.matchMedia('(prefers-contrast: more)');
		
		const handler = () => {
			const newEffective = getSystemPreference();
			_effectiveTheme = newEffective;
			applyTheme(newEffective);
		};
		
		darkMq.addEventListener('change', handler);
		contrastMq.addEventListener('change', handler);
		
		return () => {
			darkMq.removeEventListener('change', handler);
			contrastMq.removeEventListener('change', handler);
		};
	});
	
	function setTheme(newTheme: Theme): void {
		theme = newTheme;
		saveTheme(newTheme);
		
		const effective = resolveTheme(newTheme);
		_effectiveTheme = effective;
		applyTheme(effective);
	}
	
	// Simple toggle cycles: light → dark → high-contrast → light
	function toggleTheme(): void {
		const cycle: EffectiveTheme[] = ['light', 'dark', 'high-contrast'];
		const currentIndex = cycle.indexOf(_effectiveTheme);
		const nextIndex = (currentIndex + 1) % cycle.length;
		setTheme(cycle[nextIndex]);
	}
	
	return {
		get theme() { return theme; },
		set theme(t: Theme) { setTheme(t); },
		get effectiveTheme(): EffectiveTheme { return _effectiveTheme; },
		get isDark() { return _effectiveTheme === 'dark'; },
		get isHighContrast() { return _effectiveTheme === 'high-contrast'; },
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
