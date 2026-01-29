<!--
  Artellico - Mobile Menu Component
  
  Full-screen overlay menu for mobile devices.
-->

<script lang="ts">
	import type { SessionUser, SupportedLanguage } from '$types';
	import LanguageSelector from '$components/ui/LanguageSelector.svelte';
	
	interface Props {
		isOpen: boolean;
		user: SessionUser | null;
		language: SupportedLanguage;
		supportedLanguages: SupportedLanguage[];
		onClose: () => void;
		onLanguageSelect: (lang: SupportedLanguage) => void;
		t: (key: string, params?: Record<string, string | number>) => string;
	}
	
	let {
		isOpen,
		user,
		language,
		supportedLanguages,
		onClose,
		onLanguageSelect,
		t,
	}: Props = $props();
	
	// Navigation items
	const navItems = [
		{ href: '/', label: 'nav.dashboard' },
		{ href: '/wissen', label: 'nav.knowledge' },
		{ href: '/literatur', label: 'nav.literature' },
		{ href: '/recent', label: 'nav.recent' },
		{ href: '/tags', label: 'nav.tags' },
		{ href: '/settings', label: 'nav.settings' },
	];
	
	function handleNavClick() {
		onClose();
	}
	
	// Handle escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div class="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation menu">
		<!-- Backdrop -->
		<button
			type="button"
			class="backdrop"
			onclick={onClose}
			aria-label="Close menu"
		></button>
		
		<!-- Menu panel -->
		<div class="menu-panel">
			<!-- Header -->
			<div class="menu-header">
				<span class="menu-title">Menu</span>
				<button type="button" class="close-btn" onclick={onClose} aria-label="Close menu">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>
			
			<!-- User info (if logged in) -->
			{#if user}
				<div class="user-section">
					<div class="user-avatar">
						{#if user.avatarUrl}
							<img src={user.avatarUrl} alt="" />
						{:else}
							<span class="avatar-initial">{(user.displayName || user.username).charAt(0).toUpperCase()}</span>
						{/if}
					</div>
					<div class="user-info">
						<span class="user-name">{user.displayName || user.username}</span>
						<span class="user-email">{user.email}</span>
					</div>
				</div>
			{/if}
			
			<!-- Navigation -->
			<nav class="menu-nav">
				<ul class="nav-list">
					{#each navItems as item}
						<li>
							<a href={item.href} class="nav-item" onclick={handleNavClick}>
								{t(item.label)}
							</a>
						</li>
					{/each}
					
					{#if user?.role === 'admin' || user?.role === 'superadmin'}
						<li>
							<a href="/admin" class="nav-item" onclick={handleNavClick}>
								{t('nav.admin')}
							</a>
						</li>
					{/if}
				</ul>
			</nav>
			
			<!-- Footer actions -->
			<div class="menu-footer">
				<div class="language-row">
					<span class="label">{t('settings.language')}</span>
					<LanguageSelector
						{language}
						{supportedLanguages}
						onSelect={onLanguageSelect}
					/>
				</div>
				
				{#if user}
					<form action="/auth/logout" method="POST" class="logout-form">
						<button type="submit" class="logout-btn">
							{t('nav.logout')}
						</button>
					</form>
				{:else}
					<a href="/auth" class="login-btn" onclick={handleNavClick}>
						{t('auth.login')}
					</a>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.mobile-menu {
		position: fixed;
		inset: 0;
		z-index: var(--z-modal);
		display: flex;
	}
	
	.backdrop {
		position: absolute;
		inset: 0;
		background: var(--color-bg-overlay);
		border: none;
		cursor: default;
	}
	
	.menu-panel {
		position: relative;
		width: min(320px, 85vw);
		height: 100%;
		background: var(--color-bg-elevated);
		display: flex;
		flex-direction: column;
		animation: slideIn var(--duration-base) var(--ease-out);
	}
	
	@keyframes slideIn {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(0);
		}
	}
	
	.menu-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4);
		border-bottom: 1px solid var(--color-border);
	}
	
	.menu-title {
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		font-weight: 600;
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
	}
	
	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.close-btn:hover {
		color: var(--color-text);
		background: var(--color-bg-sunken);
	}
	
	.close-btn svg {
		width: 24px;
		height: 24px;
	}
	
	.user-section {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		border-bottom: 1px solid var(--color-border);
	}
	
	.user-avatar {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-full);
		background: var(--color-bg-sunken);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		flex-shrink: 0;
	}
	
	.user-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.avatar-initial {
		font-family: var(--font-machine);
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text-secondary);
	}
	
	.user-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
	}
	
	.user-name {
		font-family: var(--font-human);
		font-size: var(--font-size-base);
		font-weight: 500;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.user-email {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.menu-nav {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-4);
	}
	
	.nav-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	
	.nav-item {
		display: block;
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-sm);
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-secondary);
		text-decoration: none;
		transition: all var(--transition-fast);
	}
	
	.nav-item:hover {
		color: var(--color-text);
		background: var(--color-bg-sunken);
	}
	
	.menu-footer {
		padding: var(--space-4);
		border-top: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.language-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	
	.label {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-muted);
	}
	
	.logout-form {
		width: 100%;
	}
	
	.logout-btn,
	.login-btn {
		display: block;
		width: 100%;
		padding: var(--space-3) var(--space-4);
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		text-align: center;
		text-decoration: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.logout-btn {
		background: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text-secondary);
	}
	
	.logout-btn:hover {
		border-color: var(--color-error);
		color: var(--color-error);
	}
	
	.login-btn {
		background: var(--color-accent);
		border: 1px solid var(--color-accent);
		color: var(--color-text-inverse);
	}
	
	.login-btn:hover {
		background: var(--color-accent-hover);
		border-color: var(--color-accent-hover);
	}
</style>
