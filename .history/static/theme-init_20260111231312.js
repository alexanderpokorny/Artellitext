/**
 * Artellico - Theme Initialization (Blocking)
 * 
 * This script MUST run before any CSS is parsed to prevent theme flash.
 * It reads the user's preference from localStorage and applies it immediately.
 */
(function() {
	var STORAGE_KEY = 'artellico_theme';
	var theme = localStorage.getItem(STORAGE_KEY);
	var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	
	// Apply dark mode if:
	// 1. User explicitly chose 'dark', OR
	// 2. User hasn't chosen 'light' AND system prefers dark
	if (theme === 'dark' || (theme !== 'light' && systemDark)) {
		document.documentElement.classList.add('dark');
	}
})();
