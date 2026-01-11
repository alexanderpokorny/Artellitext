/**
 * Artellico - Service Worker for Offline Support
 * 
 * PWA service worker implementing cache-first strategy.
 */

/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = `artellico-${version}`;

// Assets to cache on install
const STATIC_ASSETS = [
	...build,
	...files,
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(STATIC_ASSETS))
			.then(() => self.skipWaiting())
	);
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys
					.filter((key) => key !== CACHE_NAME)
					.map((key) => caches.delete(key))
			);
		}).then(() => self.clients.claim())
	);
});

// Fetch: Cache-first for static, network-first for API
self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);
	
	// Skip cross-origin requests
	if (url.origin !== location.origin) return;
	
	// Network-first for API routes
	if (url.pathname.startsWith('/api/')) {
		event.respondWith(networkFirst(request));
		return;
	}
	
	// Cache-first for static assets
	if (STATIC_ASSETS.includes(url.pathname)) {
		event.respondWith(cacheFirst(request));
		return;
	}
	
	// Network-first for pages (HTML)
	if (request.mode === 'navigate') {
		event.respondWith(networkFirst(request));
		return;
	}
	
	// Default: cache-first
	event.respondWith(cacheFirst(request));
});

/**
 * Cache-first strategy
 */
async function cacheFirst(request: Request): Promise<Response> {
	const cached = await caches.match(request);
	if (cached) return cached;
	
	const response = await fetch(request);
	if (response.ok) {
		const cache = await caches.open(CACHE_NAME);
		cache.put(request, response.clone());
	}
	return response;
}

/**
 * Network-first strategy with cache fallback
 */
async function networkFirst(request: Request): Promise<Response> {
	try {
		const response = await fetch(request);
		if (response.ok) {
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		const cached = await caches.match(request);
		if (cached) return cached;
		
		// Return offline page for navigation requests
		if (request.mode === 'navigate') {
			const offlinePage = await caches.match('/offline');
			if (offlinePage) return offlinePage;
		}
		
		return new Response('Offline', { status: 503 });
	}
}
