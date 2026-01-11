<!--
  Artellico - Theme Selector Component
  
  Dropdown menu for theme selection with accessibility support.
  Themes: Light, Dark, High Contrast (E-Ink), Auto
  
  WCAG 2.1 AA compliant - keyboard navigable, screen reader friendly.
-->

<script lang="ts">
	import type { Theme, EffectiveTheme } from '$lib/types';
	
	interface Props {
		theme: Theme;
		effectiveTheme: EffectiveTheme;
		onSelect: (theme: Theme) => void;
	}
	
	let { theme, effectiveTheme, onSelect }: Props = $props();
	
	let isOpen = $state(false);
	let buttonRef: HTMLButtonElement;
	let menuRef: HTMLDivElement;
	
	const themes: { value: Theme; labelDe: string; labelEn: string; icon: string; description: string }[] = [
		{ value: 'light', labelDe: 'Hell', labelEn: 'Light', icon: 'sun', description: 'Helles Design' },
		{ value: 'dark', labelDe: 'Dunkel', labelEn: 'Dark', icon: 'moon', description: 'Dunkles Design' },
		{ value: 'high-contrast', labelDe: 'Kontrast', labelEn: 'Contrast', icon: 'contrast', description: 'Maximaler Kontrast (E-Ink, Barrierefreiheit)' },
		{ value: 'auto', labelDe: 'System', labelEn: 'System', icon: 'auto', description: 'Folgt Systemeinstellung' },
	];
	
	function toggle() {
		isOpen = !isOpen;
	}
	
	function select(t: Theme) {
		onSelect(t);
		isOpen = false;
		buttonRef?.focus();
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			isOpen = false;
			buttonRef?.focus();
		}
	}
	
	function handleClickOutside(e: MouseEvent) {
		if (isOpen && menuRef && !menuRef.contains(e.target as Node) && !buttonRef.contains(e.target as Node)) {
			isOpen = false;
		}
	}
	
	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
	
	function getCurrentIcon(effective: EffectiveTheme): string {
		switch (effective) {
			case 'dark': return 'moon';
			case 'high-contrast': return 'contrast';
			default: return 'sun';
		}
	}
</script>

<div class="theme-selector" onkeydown={handleKeydown}>
	<button
		bind:this={buttonRef}
		type="button"
		class="theme-button"
		onclick={toggle}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		aria-label="Theme auswählen"
		title="Theme auswählen"
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
		
		<!-- Dropdown indicator -->
		<svg class="chevron" class:open={isOpen} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<polyline points="6 9 12 15 18 9" />
		</svg>
	</button>
	
	{#if isOpen}
		<div 
			bind:this={menuRef}
			class="theme-menu"
			role="listbox"
			aria-label="Verfügbare Themes"
		>
			{#each themes as t}
				<button
					type="button"
					class="theme-option"
					class:selected={theme === t.value}
					role="option"
					aria-selected={theme === t.value}
					onclick={() => select(t.value)}
					title={t.description}
				>
					<!-- Icon -->
					{#if t.icon === 'sun'}
						<svg class="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
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
					{:else if t.icon === 'moon'}
						<svg class="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
						</svg>
					{:else if t.icon === 'contrast'}
						<svg class="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<circle cx="12" cy="12" r="10" />
							<path d="M12 2v20" />
							<path d="M12 2a10 10 0 0 1 0 20" fill="currentColor" />
						</svg>
					{:else}
						<svg class="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
							<line x1="8" y1="21" x2="16" y2="21" />
							<line x1="12" y1="17" x2="12" y2="21" />
						</svg>
					{/if}
					
					<span class="option-label">{t.labelDe}</span>
					
					{#if theme === t.value}
						<svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<polyline points="20 6 9 17 4 12" />
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.theme-selector {
		position: relative;
	}
	
	.theme-button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-2);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: color var(--transition-fast), background-color var(--transition-fast);
	}
	
	.theme-button:hover {
		color: var(--color-text);
		background-color: var(--color-bg-sunken);
	}
	
	.theme-button:focus-visible {
		outline: 2px solid var(--color-text);
		outline-offset: 2px;
	}
	
	.icon {
		width: 20px;
		height: 20px;
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
	
	.theme-menu {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: var(--space-1);
		min-width: 160px;
		padding: var(--space-1);
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		z-index: 100;
	}
	
	.theme-option {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-2) var(--space-3);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font-family: var(--font-human);
		font-size: var(--font-size-sm);
		text-align: left;
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}
	
	.theme-option:hover {
		background-color: var(--color-bg-sunken);
	}
	
	.theme-option:focus-visible {
		outline: 2px solid var(--color-text);
		outline-offset: -2px;
	}
	
	.theme-option.selected {
		background-color: var(--color-bg-sunken);
	}
	
	.option-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
		color: var(--color-text-secondary);
	}
	
	.option-label {
		flex: 1;
	}
	
	.check {
		width: 16px;
		height: 16px;
		color: var(--color-text);
	}
	
	/* High contrast mode - ensure menu is clearly visible */
	:global(html.high-contrast) .theme-menu {
		border-width: 2px;
	}
	
	:global(html.high-contrast) .theme-option:focus-visible {
		outline-width: 3px;
	}
</style>
