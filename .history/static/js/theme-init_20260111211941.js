/**
 * ARTELLICO - Theme Initialization Script
 * 
 * This script MUST be loaded FIRST, before any CSS or other JS.
 * It reads the stored theme preference and sets the data-theme attribute
 * on the HTML element BEFORE any rendering occurs.
 * 
 * It also sets critical inline styles that will be overridden by app.css
 * once it loads. This prevents any flash of wrong colors.
 * 
 * DO NOT MOVE THIS LOGIC ELSEWHERE - it must run synchronously
 * before the browser starts painting.
 */
(function() {
	'use strict';
	
	// === CONSTANTS ===
	var STORAGE_KEY = 'artellico_theme';
	
	// === CRITICAL COLORS (must match app.css exactly!) ===
	var COLORS = {
		light: {
			bg: '#e8e8e8',
			sidebar: '#dedede',
			text: '#171717',
			border: '#b0b0b0'
		},
		dark: {
			bg: '#0a0a0a',
			sidebar: '#171717',
			text: '#fafafa',
			border: '#404040'
		}
	};
	
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
	var html = document.documentElement;
	html.setAttribute('data-theme', activeTheme);
	html.style.colorScheme = activeTheme;
	
	// === SET CRITICAL COLORS (prevents flash until CSS loads) ===
	var colors = COLORS[activeTheme];
	html.style.backgroundColor = colors.bg;
	html.style.color = colors.text;
	
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
		stored: stored,
		colors: colors
	};
})();
