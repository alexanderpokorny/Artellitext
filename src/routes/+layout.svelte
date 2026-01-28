<!--
  Artellico - Root Layout
  
  Main application shell with responsive navigation.
  For /auth routes, renders only children (standalone page).
  
  Structure:
    .app-layout
    ├── .sidebar (Logo + Navigation + Copyright)
    └── .main-area (Header + Content + Footer)
-->

<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import ThemeSelector from '$components/ui/ThemeSelector.svelte';
	import LanguageSelector from '$components/ui/LanguageSelector.svelte';
	import MobileMenu from '$components/layout/MobileMenu.svelte';
	import { createTheme, createReadingMode } from '$stores/theme.svelte';
	import { createI18n } from '$stores/i18n.svelte';
	import { createUserState } from '$stores/user.svelte';
	import { getEditorStats } from '$stores/editorStats.svelte';
	import type { LayoutData } from './$types';
	
	// Props from server load
	let { data, children }: { data: LayoutData; children: any } = $props();
	
	// Check if we're on auth route (standalone, no app shell)
	let isAuthRoute = $derived($page.url.pathname.startsWith('/auth'));
	
	// Derive user from data for reactivity
	let currentUser = $derived(data.user);
	
	// Initialize stores with server data
	const themeStore = createTheme();
	const readingMode = createReadingMode();
	const i18n = createI18n();
	const userState = createUserState();
	const editorStats = getEditorStats();
	
	// Update user state when data changes
	$effect(() => {
		userState.setUser(currentUser);
	});
	
	// Local UI state
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
	
	// Apply language
	$effect(() => {
		if (browser) {
			document.documentElement.lang = i18n.language;
		}
	});
	
	// Close mobile menu on route change
	$effect(() => {
		data.url;
		mobileMenuOpen = false;
	});
	
	// Dynamic year for copyright
	const currentYear = new Date().getFullYear();
	
	// Navigation items
	const mainNav = [
		{ href: '/', icon: 'dashboard', label: 'nav.dashboard' },
		{ href: '/editor', icon: 'edit', label: 'nav.knowledge' },
		{ href: '/literatur', icon: 'book', label: 'nav.literature' },
	];
	
	function isActive(href: string): boolean {
		if (href === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(href);
	}
	
	// Icon SVGs
	const icons: Record<string, string> = {
		dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
		edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
		book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
		settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
		profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
		admin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
		search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
		menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
		logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
	};
	
	// Status text
	let statusText = $derived(
		syncStatus === 'offline' ? i18n.t('status.offline') :
		syncStatus === 'syncing' ? i18n.t('status.syncing') :
		i18n.t('status.synced')
	);
	
	// Stats from layout data
	const stats = $derived(data.stats);
	
	// Format storage size (MB or GB)
	const formattedStorage = $derived(() => {
		const bytes = stats?.storageBytes ?? 0;
		if (bytes === 0) return '0 MB';
		const mb = bytes / (1024 * 1024);
		if (mb >= 1024) {
			return `${(mb / 1024).toFixed(1)} GB`;
		}
		return `${Math.round(mb)} MB`;
	});
</script>

<svelte:head>
	<title>Artellico</title>
	<meta name="description" content="Artellico - Kognitive Denkplattform für akademisches Consulting und Wissensmanagement" />
</svelte:head>

<!-- Auth routes OR no user: Render only children (standalone page / loading) -->
{#if isAuthRoute || !data.user}
	{@render children()}
{:else}
<!-- ==========================================
     MAIN APP LAYOUT - CSS Grid 3x2
     
     Grid Structure:
     ┌─────────────────┬─────────────────────────┐
     │ sidebar-header  │ main-header             │  Row 1: 60px
     ├─────────────────┼─────────────────────────┤
     │ sidebar-nav     │ main-content            │  Row 2: 1fr (flexible)
     ├─────────────────┼─────────────────────────┤
     │ sidebar-footer  │ main-footer             │  Row 3: 40px
     └─────────────────┴─────────────────────────┘
       Col 1: 260px      Col 2: 1fr
     ========================================== -->
<div class="app-layout" class:reading-mode={readingMode.enabled}>
	
	<!-- Grid Area: sidebar-header -->
	<header class="sidebar-header hide-mobile">
		<a href="/" class="sidebar-brand">
			<img src="/icons/Artellico Logo.png" alt="Artellitext" class="sidebar-logo logo-light" />
			<img src="/icons/Artellico Logo White.png" alt="Artellitext" class="sidebar-logo logo-dark" />
			<span class="sidebar-title" style="position: relative; top: 3px;">ARTELLITEXT</span>
		</a>
	</header>
	
	<!-- Grid Area: main-header -->
	<header class="main-header">
		<!-- Mobile Menu Toggle -->
		<button
			type="button"
			class="icon-btn show-mobile-only"
			onclick={() => mobileMenuOpen = !mobileMenuOpen}
			aria-label="Toggle menu"
		>
			{@html icons.menu}
		</button>
		
		<!-- Search Bar -->
		<div class="search-bar hide-mobile">
			<span class="search-icon">{@html icons.search}</span>
			<input
				type="search"
				id="global-search"
				name="search"
				class="search-input"
				placeholder={i18n.t('action.search')}
				autocomplete="off"
			/>
		</div>
		
		<!-- Header Controls -->
		<div class="header-controls">
			<LanguageSelector
				language={i18n.language}
				supportedLanguages={i18n.supportedLanguages}
				onSelect={i18n.setLanguage}
				compact
			/>
			
			<ThemeSelector 
				theme={themeStore.theme}
				effectiveTheme={themeStore.effectiveTheme}
				onSelect={themeStore.setTheme}
				t={i18n.t}
			/>
			
			{#if userState.user}
				<a href="/settings" class="user-avatar" title={userState.user.displayName || userState.user.username}>
					{#if userState.user.avatarUrl}
						<img src={userState.user.avatarUrl} alt="" />
					{:else}
						<span class="avatar-initial">{(userState.user.displayName || userState.user.username).charAt(0).toUpperCase()}</span>
					{/if}
				</a>
			{:else}
				<a href="/auth" class="btn btn-primary btn-sm">
					{i18n.t('auth.login')}
				</a>
			{/if}
		</div>
	</header>
	
	<!-- Grid Area: sidebar-nav -->
	<aside class="sidebar-nav hide-mobile">
		<nav class="nav-container">
			<!-- Main Navigation -->
			<ul class="nav-list">
				{#each mainNav as item}
					<li>
						<a
							href={item.href}
							class="nav-item"
							class:active={isActive(item.href)}
						>
							<span class="nav-icon">{@html icons[item.icon]}</span>
							<span class="nav-label">{i18n.t(item.label as Parameters<typeof i18n.t>[0])}</span>
						</a>
					</li>
				{/each}
			</ul>
			
			<!-- Spacer to push bottom nav down -->
			<div class="nav-spacer"></div>
			
			<!-- Bottom Navigation (sticky) -->
			<ul class="nav-list nav-list-bottom" class:has-user={userState.user}>
				{#if userState.user}
					<!-- Settings (includes profile) -->
					<li>
						<a
							href="/settings"
							class="nav-item"
							class:active={isActive('/settings')}
						>
							<span class="nav-icon">{@html icons.settings}</span>
							<span class="nav-label">{i18n.t('nav.settings')}</span>
						</a>
					</li>
					
					<li>
						<form action="/auth/logout" method="POST" class="logout-form">
							<button type="submit" class="nav-item">
								<span class="nav-icon">{@html icons.logout}</span>
								<span class="nav-label">{i18n.t('nav.logout')}</span>
							</button>
						</form>
					</li>
				{:else}
					<!-- Settings for non-logged-in users -->
					<li>
						<a
							href="/settings"
							class="nav-item"
							class:active={$page.url.pathname === '/settings'}
						>
							<span class="nav-icon">{@html icons.settings}</span>
							<span class="nav-label">{i18n.t('nav.settings')}</span>
						</a>
					</li>
				{/if}
			</ul>
		</nav>
	</aside>
	
	<!-- Grid Area: main-content -->
	<main class="main-content">
		{@render children()}
	</main>
	
	<!-- Grid Area: sidebar-footer -->
	<footer class="sidebar-footer hide-mobile">
		<p class="sidebar-copyright">© {currentYear} Artellico</p>
	</footer>
	
	<!-- Grid Area: main-footer -->
	<footer class="main-footer">
		<span class="status-indicator" class:offline={syncStatus === 'offline'}>
			{statusText}
		</span>
		<span class="footer-stats">
			{#if editorStats.isEditorActive}
				<span class="footer-stat">{editorStats.wordCount} {i18n.t('editor.words')}</span>
				<span class="footer-divider">·</span>
				<span class="footer-stat">{editorStats.readingTime} min</span>
				<span class="footer-divider">·</span>
			{/if}
			{#if stats}
				<span class="footer-stat">{stats.notes} {i18n.t('dashboard.stats.notes')}</span>
				<span class="footer-divider">·</span>
				<span class="footer-stat">{stats.documents} {i18n.t('dashboard.stats.documents')}</span>
				<span class="footer-divider">·</span>
				<span class="footer-stat">{formattedStorage()}</span>
			{/if}
		</span>
	</footer>
</div>

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
{/if}

<style>
	/* Component-specific styles - Layout Grid is in app.css */
	
	.sidebar-brand {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		text-decoration: none;
		color: var(--color-text);
	}
	
	.logout-form {
		margin: 0;
		padding: 0;
	}
	
	.logout-form .nav-item {
		width: 100%;
		border: none;
		background: transparent;
		cursor: pointer;
	}
	
	.status-indicator {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	
	.status-indicator::before {
		content: '';
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-success);
	}
	
	.status-indicator.offline::before {
		background: var(--color-warning);
	}
	
	/* Reading mode - only show main content */
	.app-layout.reading-mode {
		grid-template-columns: 1fr;
		grid-template-areas: 
			"main-body";
	}
	
	.app-layout.reading-mode .sidebar-header,
	.app-layout.reading-mode .sidebar-nav,
	.app-layout.reading-mode .sidebar-footer,
	.app-layout.reading-mode .main-header,
	.app-layout.reading-mode .main-footer {
		display: none;
	}
	
	.app-layout.reading-mode .main-content {
		max-width: var(--content-max-width);
		margin: 0 auto;
		padding: var(--space-8);
	}
</style>
