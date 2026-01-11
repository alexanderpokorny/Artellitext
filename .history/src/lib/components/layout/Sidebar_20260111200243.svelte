<!--
  Artellico - Sidebar Navigation Component
  
  Collapsible sidebar with main navigation and user actions.
-->

<script lang="ts">
	import { page } from '$app/stores';
	import type { SessionUser } from '$types';
	
	interface Props {
		user: SessionUser | null;
		collapsed: boolean;
		onToggleCollapse: () => void;
		t: (key: string, params?: Record<string, string | number>) => string;
	}
	
	let { user, collapsed, onToggleCollapse, t }: Props = $props();
	
	// Navigation items - main section
	const mainNav = [
		{ href: '/', icon: 'dashboard', label: 'nav.dashboard' },
		{ href: '/editor', icon: 'edit', label: 'nav.knowledge' },
		{ href: '/literatur', icon: 'book', label: 'nav.literature' },
		{ href: '/recent', icon: 'clock', label: 'nav.recent' },
		{ href: '/tags', icon: 'tag', label: 'nav.tags' },
	];
	
	// Navigation items - bottom section
	const bottomNav = [
		{ href: '/settings', icon: 'settings', label: 'nav.settings' },
		{ href: '/profile', icon: 'user', label: 'nav.profile' },
	];
	
	function isActive(href: string): boolean {
		if (href === '/') {
			return $page.url.pathname === '/';
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<aside class="sidebar" class:collapsed aria-label="Main navigation">
	<!-- Collapse toggle -->
	<button
		type="button"
		class="collapse-toggle hide-mobile"
		onclick={onToggleCollapse}
		aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
	>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			{#if collapsed}
				<polyline points="9 18 15 12 9 6" />
			{:else}
				<polyline points="15 18 9 12 15 6" />
			{/if}
		</svg>
	</button>
	
	<!-- Main navigation -->
	<nav class="nav-main">
		<ul class="nav-list">
			{#each mainNav as item}
				<li>
					<a
						href={item.href}
						class="nav-item"
						class:active={isActive(item.href)}
						aria-current={isActive(item.href) ? 'page' : undefined}
					>
						<span class="nav-icon">
							{@html getIcon(item.icon)}
						</span>
						{#if !collapsed}
							<span class="nav-label">{t(item.label)}</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
	
	<!-- Bottom navigation -->
	<nav class="nav-bottom">
		<ul class="nav-list">
			{#each bottomNav as item}
				<li>
					<a
						href={item.href}
						class="nav-item"
						class:active={isActive(item.href)}
						aria-current={isActive(item.href) ? 'page' : undefined}
					>
						<span class="nav-icon">
							{@html getIcon(item.icon)}
						</span>
						{#if !collapsed}
							<span class="nav-label">{t(item.label)}</span>
						{/if}
					</a>
				</li>
			{/each}
			
			<!-- Admin link (only for admins) -->
			{#if user?.role === 'admin' || user?.role === 'superadmin'}
				<li>
					<a
						href="/admin"
						class="nav-item"
						class:active={isActive('/admin')}
						aria-current={isActive('/admin') ? 'page' : undefined}
					>
						<span class="nav-icon">
							{@html getIcon('shield')}
						</span>
						{#if !collapsed}
							<span class="nav-label">{t('nav.admin')}</span>
						{/if}
					</a>
				</li>
			{/if}
			
			<!-- Logout (only when logged in) -->
			{#if user}
				<li>
					<form action="/auth/logout" method="POST">
						<button type="submit" class="nav-item nav-button">
							<span class="nav-icon">
								{@html getIcon('logout')}
							</span>
							{#if !collapsed}
								<span class="nav-label">{t('nav.logout')}</span>
							{/if}
						</button>
					</form>
				</li>
			{/if}
		</ul>
	</nav>
</aside>

<script module lang="ts">
	// Icon SVG strings
	function getIcon(name: string): string {
		const icons: Record<string, string> = {
			dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
			edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
			book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
			clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
			tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
			settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
			user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
			shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
			logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
		};
		return icons[name] || '';
	}
</script>

<style>
	.sidebar {
		position: relative;
		display: flex;
		flex-direction: column;
		width: var(--sidebar-width);
		flex-shrink: 0;
		background: var(--color-bg-elevated);
		border-right: 1px solid var(--color-border);
		overflow-y: auto;
		overflow-x: hidden;
		transition: width var(--transition-slow);
	}
	
	.sidebar.collapsed {
		width: var(--sidebar-collapsed-width);
	}
	
	.collapse-toggle {
		position: absolute;
		top: var(--space-4);
		right: calc(-12px);
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		color: var(--color-text-muted);
		cursor: pointer;
		z-index: 10;
		transition: all var(--transition-fast);
	}
	
	.collapse-toggle:hover {
		color: var(--color-text);
		border-color: var(--color-text);
	}
	
	.collapse-toggle svg {
		width: 14px;
		height: 14px;
	}
	
	.nav-main {
		flex: 1;
		padding: var(--space-4);
	}
	
	.nav-bottom {
		padding: var(--space-4);
		border-top: 1px solid var(--color-border);
	}
	
	.nav-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	
	.nav-item,
	.nav-button {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-3);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		text-decoration: none;
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		transition: all var(--transition-fast);
		width: 100%;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
	}
	
	.nav-item:hover,
	.nav-button:hover {
		color: var(--color-text);
		background: var(--color-bg-sunken);
	}
	
	.nav-item.active {
		color: var(--color-text);
		background: var(--color-bg-sunken);
	}
	
	.nav-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}
	
	.nav-icon :global(svg) {
		width: 100%;
		height: 100%;
	}
	
	.nav-label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.collapsed .nav-item,
	.collapsed .nav-button {
		justify-content: center;
		padding: var(--space-3);
	}
	
	.collapsed .nav-label {
		display: none;
	}
	
	@media (max-width: 767px) {
		.sidebar {
			display: none;
		}
	}
</style>
