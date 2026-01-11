<!--
  Artellico - Theme Toggle Component
  
  IMPORTANT: Uses CSS to show/hide icons based on html.dark class,
  NOT JavaScript state. This prevents flash during hydration.
-->

<script lang="ts">
	interface Props {
		onToggle: () => void;
		showLabel?: boolean;
	}
	
	let { onToggle, showLabel = false }: Props = $props();
</script>

<button
	type="button"
	class="theme-toggle"
	onclick={onToggle}
	aria-label="Toggle theme"
	title="Toggle theme"
>
	<!-- Moon icon (shown in light mode, for switching to dark) -->
	<svg class="icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
	</svg>
	<!-- Sun icon (shown in dark mode, for switching to light) -->
	<svg class="icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
	
	{#if showLabel}
		<span class="label label-dark">Light</span>
		<span class="label label-light">Dark</span>
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
	
	.icon {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}
	
	/* Light mode: show moon, hide sun */
	.icon-moon { display: block; }
	.icon-sun { display: none; }
	.label-light { display: inline; }
	.label-dark { display: none; }
	
	/* Dark mode: show sun, hide moon */
	:global(html.dark) .icon-moon { display: none; }
	:global(html.dark) .icon-sun { display: block; }
	:global(html.dark) .label-light { display: none; }
	:global(html.dark) .label-dark { display: inline; }
	
	.label {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
	}
</style>
