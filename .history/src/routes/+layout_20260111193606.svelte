<!--
  Artellico - Root Layout
  
  Main application shell with responsive navigation.
  Implements the classic SaaS layout with sidebar and header.
-->

<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import Header from '$components/layout/Header.svelte';
	import Sidebar from '$components/layout/Sidebar.svelte';
	import StatusBar from '$components/layout/StatusBar.svelte';
	import MobileMenu from '$components/layout/MobileMenu.svelte';
	import { createTheme, createReadingMode } from '$stores/theme.svelte';
	import { createI18n } from '$stores/i18n.svelte';
	import { createUserState } from '$stores/user.svelte';
	import type { LayoutData } from './$types';
	
	// Props from server load
	let { data, children }: { data: LayoutData; children: any } = $props();
	
	// Initialize stores with server data
	const themeStore = createTheme();
	const readingMode = createReadingMode();
	const i18n = createI18n();
	const userState = createUserState(data.user);
	
	// Update user state when data changes
	$effect(() => {
		userState.setUser(data.user);
	});
	
	// Local UI state
	let sidebarCollapsed = $state(false);
	let mobileMenuOpen = $state(false);
	let syncStatus = $state<'synced' | 'syncing' | 'offline'>('synced');
	
	// Detect online/offline status
	$effect(() => {
		if (!browser) return;
		
		const updateOnlineStatus = () => {
			syncStatus = navigator.onLine ? 'synced' : 'offline';
		};
		
		window.addEventListener('online', updateOnlineStatus);
		window.addEventListener('offline', updateOnlineStatus);
		updateOnlineStatus();
		
		return () => {
			window.removeEventListener('online', updateOnlineStatus);
			window.removeEventListener('offline', updateOnlineStatus);
		};
	});
	
	// Apply initial theme on mount
	$effect(() => {
		if (browser) {
			// Theme is already applied by the store, just ensure HTML lang is set
			document.documentElement.lang = i18n.language;
		}
	});
	
	// Close mobile menu on route change
	$effect(() => {
		// Watch for URL changes
		data.url;
		mobileMenuOpen = false;
	});
	
	// Determine context for status bar
	let statusContext = $derived<'knowledge' | 'literature' | 'default'>(
		data.url?.startsWith('/editor') ? 'knowledge' :
		data.url?.startsWith('/literatur') ? 'literature' :
		'default'
	);
</script>

<svelte:head>
	<title>Artellico</title>
	<meta name="description" content="Artellico - Kognitive Denkplattform für akademisches Consulting und Wissensmanagement" />
</svelte:head>

<div class="app" class:reading-mode={readingMode.enabled}>
	<!-- Header -->
	<Header
		user={userState.user}
		effectiveTheme={themeStore.effectiveTheme}
		language={i18n.language}
		supportedLanguages={i18n.supportedLanguages}
		onThemeToggle={themeStore.toggleTheme}
		onLanguageSelect={i18n.setLanguage}
		onMenuToggle={() => mobileMenuOpen = !mobileMenuOpen}
		t={(key: string, params?: Record<string, string | number>) => i18n.t(key as Parameters<typeof i18n.t>[0], params)}
	/>
	
	<div class="app-body">
		<!-- Sidebar (Desktop) -->
		<Sidebar
			user={userState.user}
			collapsed={sidebarCollapsed}
			onToggleCollapse={() => sidebarCollapsed = !sidebarCollapsed}
			t={(key: string, params?: Record<string, string | number>) => i18n.t(key as Parameters<typeof i18n.t>[0], params)}
		/>
		
		<!-- Main Content -->
		<main class="main-content">
			{@render children()}
		</main>
	</div>
	
	<!-- Status Bar -->
	<StatusBar
		{syncStatus}
		context={statusContext}
		t={(key: string, params?: Record<string, string | number>) => i18n.t(key as Parameters<typeof i18n.t>[0], params)}
	/>
	
	<!-- Mobile Menu -->
	<MobileMenu
		isOpen={mobileMenuOpen}
		user={userState.user}
		language={i18n.language}
		supportedLanguages={i18n.supportedLanguages}
		onClose={() => mobileMenuOpen = false}
		onLanguageSelect={i18n.setLanguage}
		t={(key: string, params?: Record<string, string | number>) => i18n.t(key as Parameters<typeof i18n.t>[0], params)}
	/>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
		background: var(--color-bg);
	}
	
	.app-body {
		display: flex;
		flex: 1;
		min-height: 0;
	}
	
	.main-content {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: var(--site-padding);
		background: var(--color-bg);
	}
	
	/* Reading mode hides navigation elements */
	.app.reading-mode :global(.header),
	.app.reading-mode :global(.sidebar),
	.app.reading-mode :global(.status-bar) {
		display: none;
	}
	
	.app.reading-mode .main-content {
		padding: var(--space-8);
		max-width: var(--content-max-width);
		margin: 0 auto;
	}
	
	@media (max-width: 767px) {
		.app-body {
			flex-direction: column;
		}
		
		.main-content {
			padding: var(--space-4);
		}
	}
</style>
