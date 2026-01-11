/**
 * ARTELLICO - Theme Initialization Script
 * 
 * This script MUST be loaded FIRST, before any CSS or other JS.
 * It reads the stored theme preference and sets the data-theme attribute
 * on the HTML element BEFORE any rendering occurs.
 * 
 * DO NOT MOVE THIS LOGIC ELSEWHERE - it must run synchronously
 * before the browser starts painting.
 */
(function() {
	'use strict';
	
	// === CONSTANTS ===
	var STORAGE_KEY = 'artellico_theme';
	var VALID_THEMES = ['light', 'dark'];
	
	// === DETECT SYSTEM PREFERENCE ===
	var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	var systemTheme = prefersDark ? 'dark' : 'light';
	
	// === GET STORED THEME ===
	var stored = null;
	try {
		stored = localStorage.getItem(STORAGE_KEY);
	} catch (e) {
		// localStorage not available (private browsing, etc.)
	}
	
	// === DETERMINE ACTIVE THEME ===
	var activeTheme;
	if (stored === 'dark' || stored === 'light') {
		activeTheme = stored;
	} else if (stored === 'auto' || !stored) {
		activeTheme = systemTheme;
	} else {
		activeTheme = systemTheme;
	}
	
	// === APPLY THEME IMMEDIATELY ===
	document.documentElement.setAttribute('data-theme', activeTheme);
	document.documentElement.style.colorScheme = activeTheme;
	
	// === FAVICON BASED ON BROWSER THEME (opposite color for visibility) ===
	var updateFavicon = function() {
		var isDarkBrowser = window.matchMedia('(prefers-color-scheme: dark)').matches;
		var iconPath = isDarkBrowser 
			? '/icons/Artellico Logo White.png'
			: '/icons/Artellico Logo.png';
		
		var dynamicFavicon = document.getElementById('dynamic-favicon');
		if (!dynamicFavicon) {
			dynamicFavicon = document.createElement('link');
			dynamicFavicon.id = 'dynamic-favicon';
			dynamicFavicon.rel = 'icon';
			dynamicFavicon.type = 'image/png';
			document.head.appendChild(dynamicFavicon);
		}
		dynamicFavicon.href = iconPath;
	};
	
	// Update favicon when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', updateFavicon);
	} else {
		updateFavicon();
	}
	
	// Listen for browser theme changes (for favicon)
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateFavicon);
	
	// === EXPOSE FOR DEBUGGING ===
	window.__ARTELLICO_THEME__ = {
		active: activeTheme,
		system: systemTheme,
		stored: stored
	};
})();
