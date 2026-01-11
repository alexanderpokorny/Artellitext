<!--
  Artellico - Theme Toggle Component
  
  Toggles between light/dark themes with optional auto mode.
  Uses SVG icons for sun/moon representation.
-->

<script lang="ts">
	
	interface Props {
		effectiveTheme: 'light' | 'dark';
		onToggle: () => void;
		showLabel?: boolean;
	}
	
	let { effectiveTheme, onToggle, showLabel = false }: Props = $props();
</script>

<button
	type="button"
	class="theme-toggle"
	onclick={onToggle}
	aria-label={effectiveTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
	title={effectiveTheme === 'light' ? 'Dark mode' : 'Light mode'}
>
	{#if effectiveTheme === 'light'}
		<!-- Moon icon for switching to dark -->
		<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	{:else}
		<!-- Sun icon for switching to light -->
		<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
	{/if}
	
	{#if showLabel}
		<span class="label">{effectiveTheme === 'light' ? 'Dark' : 'Light'}</span>
	{/if}
</button>

<style>
	.theme-toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: color var(--transition-fast), background-color var(--transition-fast);
	}
	
	.theme-toggle:hover {
		color: var(--color-text);
		background-color: var(--color-bg-sunken);
	}
	
	.theme-toggle:focus-visible {
		outline: 2px solid var(--color-accent-blue);
		outline-offset: 2px;
	}
	
	.icon {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}
	
	.label {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
	}
</style>
