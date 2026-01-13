/**
 * Artellico - Favicon Switcher
 * 
 * Switches favicons based on BROWSER prefers-color-scheme (NOT app theme).
 * This ensures proper contrast: dark icons on light browser, light icons on dark browser.
 * 
 * Loaded in <head>, but waits for DOMContentLoaded to manipulate DOM safely.
 */
(function() {
    'use strict';
    
    var cacheVersion = Date.now();
    
    function isDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    function updateFavicons() {
        var dark = isDarkMode();
        var head = document.head;
        if (!head) return; // Safety check
        
        // Remove all existing favicon links
        var oldLinks = head.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]');
        oldLinks.forEach(function(link) {
            link.parentNode.removeChild(link);
        });
        
        // Base path: dark/ contains light/inverted icons for dark browser mode
        var basePath = dark ? '/icons/dark/' : '/';
        
        // Create new favicon links with cache-busting
        var favicons = [
            { rel: 'icon', type: 'image/png', sizes: '32x32', href: basePath + 'favicon-32x32.png' },
            { rel: 'icon', type: 'image/png', sizes: '16x16', href: basePath + 'favicon-16x16.png' },
            { rel: 'apple-touch-icon', sizes: '180x180', href: (dark ? '/icons/dark/' : '/icons/') + 'apple-touch-icon.png' }
        ];
        
        favicons.forEach(function(fav) {
            var link = document.createElement('link');
            link.rel = fav.rel;
            if (fav.type) link.type = fav.type;
            if (fav.sizes) link.sizes = fav.sizes;
            link.href = fav.href + '?v=' + cacheVersion;
            head.appendChild(link);
        });
    }
    
    // Wait for DOM to be ready before manipulating it
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateFavicons);
    } else {
        // DOM already ready
        updateFavicons();
    }
    
    // Watch for browser color scheme changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
            cacheVersion = Date.now();
            updateFavicons();
        });
    }
})();
