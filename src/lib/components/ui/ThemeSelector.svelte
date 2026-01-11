<!--
  Artellico - Theme Selector Component
  
  Dropdown menu for theme selection with accessibility support.
  Themes: Light, Dark, High Contrast (E-Ink), Auto
  
  WCAG 2.1 AA compliant - keyboard navigable, screen reader friendly.
  Design matches LanguageSelector exactly (same font, no checkmark, highlight only).
-->

<script lang="ts">
	import type { Theme, EffectiveTheme } from '$lib/types';
	
	interface Props {
		theme: Theme;
		effectiveTheme: EffectiveTheme;
		onSelect: (theme: Theme) => void;
		t: (key: string) => string;
	}
	
	let { theme, effectiveTheme, onSelect, t }: Props = $props();
	
	let isOpen = $state(false);
	
	// Theme options with i18n keys
	const themes: { value: Theme; i18nKey: string }[] = [
		{ value: 'light', i18nKey: 'settings.theme.light' },
		{ value: 'dark', i18nKey: 'settings.theme.dark' },
		{ value: 'high-contrast', i18nKey: 'settings.theme.highContrast' },
		{ value: 'auto', i18nKey: 'settings.theme.auto' },
	];
	
	function handleSelect(selectedTheme: Theme) {
		onSelect(selectedTheme);
		isOpen = false;
	}
	
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isOpen = false;
		}
	}
	
	function getCurrentIcon(effective: EffectiveTheme): string {
		switch (effective) {
			case 'dark': return 'moon';
			case 'high-contrast': return 'contrast';
			default: return 'sun';
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="theme-selector">
	<button
		type="button"
		class="trigger"
		onclick={() => isOpen = !isOpen}
		aria-expanded={isOpen}
		aria-haspopup="listbox"
	>
		<!-- Current theme icon -->
		{#if getCurrentIcon(effectiveTheme) === 'sun'}
			<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<circle cx="12" cy="12" r="5" />
				<line x1="12" y1="1" x2="12" y2="3" />
				<line x1="12" y1="21" x2="12" y2="23" />
				<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
				<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
				<line x1="1" y1="12" x2="3" y2="12" />
				<line x1="21" y1="12" x2="23" y2="12" />
				<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
				<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
			</svg>
		{:else if getCurrentIcon(effectiveTheme) === 'moon'}
			<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
			</svg>
		{:else}
			<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<circle cx="12" cy="12" r="10" />
				<path d="M12 2v20" />
				<path d="M12 2a10 10 0 0 1 0 20" fill="currentColor" />
			</svg>
		{/if}
		
		<svg class="chevron" class:open={isOpen} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<polyline points="6 9 12 15 18 9" />
		</svg>
	</button>
	
	{#if isOpen}
		<div class="dropdown" role="listbox">
			{#each themes as themeOption}
				<button
					type="button"
					class="option"
					class:selected={theme === themeOption.value}
					role="option"
					aria-selected={theme === themeOption.value}
					onclick={() => handleSelect(themeOption.value)}
				>
					<span class="theme-label">{t(themeOption.i18nKey)}</span>
				</button>
			{/each}
		</div>
	{/if}
	
	{#if isOpen}
		<!-- Backdrop to close dropdown -->
		<button
			type="button"
			class="backdrop"
			onclick={() => isOpen = false}
			aria-label="Close theme selector"
		></button>
	{/if}
</div>

<style>
	.theme-selector {
		position: relative;
		font-family: var(--font-machine);
	}
	
	.trigger {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-3);
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		font-family: inherit;
		font-size: var(--font-size-xs);
		letter-spacing: var(--tracking-wider);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.trigger:hover {
		border-color: var(--color-text);
		color: var(--color-text);
	}
	
	.icon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}
	
	.chevron {
		width: 14px;
		height: 14px;
		transition: transform var(--transition-fast);
	}
	
	.chevron.open {
		transform: rotate(180deg);
	}
	
	.dropdown {
		position: absolute;
		top: calc(100% + var(--space-1));
		right: 0;
		min-width: 100%;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-lg);
		z-index: var(--z-dropdown);
		overflow: hidden;
	}
	
	.option {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-3) var(--space-4);
		background: transparent;
		border: none;
		color: var(--color-text-secondary);
		font-family: inherit;
		font-size: var(--font-size-xs);
		letter-spacing: var(--tracking-wider);
		text-align: left;
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}
	
	.option:hover {
		background: var(--color-bg-sunken);
		color: var(--color-text);
	}
	
	.option.selected {
		color: var(--color-text);
		background: var(--color-bg-sunken);
	}
	
	.theme-label {
		font-weight: 600;
	}
	
	.backdrop {
		position: fixed;
		inset: 0;
		background: transparent;
		border: none;
		cursor: default;
		z-index: calc(var(--z-dropdown) - 1);
	}
</style>
