<!--
  Artellico - Header Component
  
  Top navigation bar with logo, search, and user controls.
-->

<script lang="ts">
	import ThemeToggle from '$components/ui/ThemeToggle.svelte';
	import LanguageSelector from '$components/ui/LanguageSelector.svelte';
	import type { SessionUser, SupportedLanguage } from '$types';
	
	interface Props {
		user: SessionUser | null;
		effectiveTheme: 'light' | 'dark';
		language: SupportedLanguage;
		supportedLanguages: SupportedLanguage[];
		onThemeToggle: () => void;
		onLanguageSelect: (lang: SupportedLanguage) => void;
		onMenuToggle: () => void;
		t: (key: string, params?: Record<string, string | number>) => string;
	}
	
	let {
		user,
		effectiveTheme,
		language,
		supportedLanguages,
		onThemeToggle,
		onLanguageSelect,
		onMenuToggle,
		t,
	}: Props = $props();
</script>

<header class="header">
	<div class="header-inner">
		<!-- Mobile menu toggle -->
		<button
			type="button"
			class="menu-toggle show-mobile-only"
			onclick={onMenuToggle}
			aria-label="Toggle menu"
		>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="3" y1="6" x2="21" y2="6" />
				<line x1="3" y1="12" x2="21" y2="12" />
				<line x1="3" y1="18" x2="21" y2="18" />
			</svg>
		</button>
		
		<!-- Logo -->
		<a href="/" class="logo">
			<img 
				src={effectiveTheme === 'dark' ? '/icons/Artellico Logo White.png' : '/icons/Artellico Logo.png'} 
				alt="Artellico" 
				class="logo-icon"
			/>
			<span class="logo-text">ARTELLICO</span>
		</a>
		
		<!-- Search bar (desktop) -->
		<div class="search-wrapper hide-mobile">
			<div class="search-bar">
				<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="11" cy="11" r="8" />
					<line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
				<input
					type="search"
					class="search-input"
					placeholder={t('action.search')}
					aria-label={t('action.search')}
				/>
				<button type="button" class="search-settings" aria-label="Search settings">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="3" />
						<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
					</svg>
				</button>
			</div>
		</div>
		
		<!-- Right controls -->
		<div class="controls">
			<LanguageSelector
				{language}
				{supportedLanguages}
				onSelect={onLanguageSelect}
				compact
			/>
			
			<ThemeToggle
				{effectiveTheme}
				onToggle={onThemeToggle}
			/>
			
			{#if user}
				<a href="/settings" class="user-avatar" title={user.displayName || user.username}>
					{#if user.avatarUrl}
						<img src={user.avatarUrl} alt="" />
					{:else}
						<span class="avatar-initial">{(user.displayName || user.username).charAt(0).toUpperCase()}</span>
					{/if}
				</a>
			{:else}
				<a href="/auth" class="btn btn-primary btn-sm">
					{t('auth.login')}
				</a>
			{/if}
		</div>
	</div>
</header>

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: var(--z-sticky);
		height: var(--header-height);
		background: var(--color-bg-elevated);
		border-bottom: 1px solid var(--color-border);
	}
	
	.header-inner {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		height: 100%;
		padding: 0 var(--site-padding);
		max-width: 100%;
	}
	
	.menu-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		padding: 0;
		background: transparent;
		border: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}
	
	.menu-toggle:hover {
		color: var(--color-text);
		background: var(--color-bg-sunken);
	}
	
	.menu-toggle svg {
		width: 24px;
		height: 24px;
	}
	
	.logo {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		text-decoration: none;
		flex-shrink: 0;
	}
	
	.logo-icon {
		height: 28px;
		width: auto;
	}
	
	.logo-text {
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		font-weight: 700;
		letter-spacing: 0.1em;
		color: var(--color-text);
	}
	
	.search-wrapper {
		flex: 1;
		max-width: 480px;
		margin: 0 var(--space-4);
	}
	
	.search-bar {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--color-bg-sunken);
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}
	
	.search-bar:focus-within {
		background: var(--color-bg-elevated);
		border-color: var(--color-border-strong);
	}
	
	.search-icon {
		width: 18px;
		height: 18px;
		color: var(--color-text-muted);
		flex-shrink: 0;
	}
	
	.search-input {
		flex: 1;
		min-width: 0;
		padding: var(--space-1) 0;
		font-family: var(--font-human);
		font-size: var(--font-size-sm);
		color: var(--color-text);
		background: transparent;
		border: none;
		outline: none;
	}
	
	.search-input::placeholder {
		color: var(--color-text-muted);
	}
	
	.search-settings {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.search-settings:hover {
		color: var(--color-text);
		background: var(--color-bg-elevated);
	}
	
	.search-settings svg {
		width: 16px;
		height: 16px;
	}
	
	.controls {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-left: auto;
	}
	
	.user-avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: var(--radius-full);
		background: var(--color-bg-sunken);
		overflow: hidden;
		transition: opacity var(--transition-fast);
	}
	
	.user-avatar:hover {
		opacity: 0.8;
	}
	
	.user-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.avatar-initial {
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-text-secondary);
	}
	
	.btn-sm {
		padding: var(--space-2) var(--space-4);
		font-size: var(--font-size-xs);
	}
	
	@media (max-width: 767px) {
		.header-inner {
			gap: var(--space-2);
		}
		
		.logo-text {
			font-size: var(--font-size-xs);
		}
	}
</style>
