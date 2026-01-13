/**
 * Artellico - Favicon Switcher
 * 
 * Switches favicons based on BROWSER prefers-color-scheme (NOT app theme).
 * This ensures proper contrast: dark icons on light browser, light icons on dark browser.
 * 
 * Runs immediately in <head> - document.head is available at this point.
 */
(function() {
    'use strict';
    
    var cacheVersion = Date.now();
    
    function isDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    function updateFavicons() {
        var dark = isDarkMode();
        var head = document.head || document.getElementsByTagName('head')[0];
        if (!head) return;
        
        // Remove all existing favicon links
        var oldLinks = head.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]');
        for (var i = 0; i < oldLinks.length; i++) {
            oldLinks[i].parentNode.removeChild(oldLinks[i]);
        }
        
        // Base path: dark/ contains light/inverted icons for dark browser mode
        // Light mode: icons are in root (/)
        // Dark mode: inverted icons are in /icons/dark/
        var basePath = dark ? '/icons/dark/' : '/';
        var applePath = dark ? '/icons/dark/' : '/icons/';
        
        // Create new favicon links with cache-busting
        var favicons = [
            { rel: 'icon', type: 'image/png', sizes: '32x32', href: basePath + 'favicon-32x32.png' },
            { rel: 'icon', type: 'image/png', sizes: '16x16', href: basePath + 'favicon-16x16.png' },
            { rel: 'apple-touch-icon', sizes: '180x180', href: applePath + 'apple-touch-icon.png' }
        ];
        
        for (var j = 0; j < favicons.length; j++) {
            var fav = favicons[j];
            var link = document.createElement('link');
            link.rel = fav.rel;
            if (fav.type) link.type = fav.type;
            if (fav.sizes) link.sizes = fav.sizes;
            link.href = fav.href + '?v=' + cacheVersion;
            head.appendChild(link);
        }
    }
    
    // Run immediately - we're in <head>, document.head exists
    updateFavicons();
    
    // Watch for browser color scheme changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
            cacheVersion = Date.now();
            updateFavicons();
        });
    }
})();
