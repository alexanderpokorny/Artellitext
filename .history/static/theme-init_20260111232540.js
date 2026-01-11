/**
 * Artellico - Theme Initialization (Blocking)
 * 
 * This script MUST run before any CSS is parsed to prevent theme flash.
 * It reads the user's preference from localStorage and applies it immediately.
 * 
 * Themes: light, dark, high-contrast, auto (follows system)
 */
(function() {
	var STORAGE_KEY = 'artellico_theme';
	var theme = localStorage.getItem(STORAGE_KEY);
	var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	var systemHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
	
	// Determine which theme class to apply
	if (theme === 'high-contrast' || (theme === 'auto' && systemHighContrast)) {
		document.documentElement.classList.add('high-contrast');
	} else if (theme === 'dark' || (theme !== 'light' && theme !== 'high-contrast' && systemDark)) {
		document.documentElement.classList.add('dark');
	}
	// light mode = no class (default)
})();
