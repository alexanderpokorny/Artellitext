<!--
  Artellico - Language Selector Component
  
  Dropdown for selecting the UI language.
-->

<script lang="ts">
	import type { SupportedLanguage } from '$types';
	import { languageNames } from '$stores/i18n';
	
	interface Props {
		language: SupportedLanguage;
		supportedLanguages: SupportedLanguage[];
		onSelect: (lang: SupportedLanguage) => void;
		compact?: boolean;
	}
	
	let { language, supportedLanguages, onSelect, compact = false }: Props = $props();
	
	let isOpen = $state(false);
	
	function handleSelect(lang: SupportedLanguage) {
		onSelect(lang);
		isOpen = false;
	}
	
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isOpen = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="language-selector" class:compact>
	<button
		type="button"
		class="trigger"
		onclick={() => isOpen = !isOpen}
		aria-expanded={isOpen}
		aria-haspopup="listbox"
	>
		<span class="current-lang">{language.toUpperCase()}</span>
		<svg class="chevron" class:open={isOpen} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<polyline points="6 9 12 15 18 9" />
		</svg>
	</button>
	
	{#if isOpen}
		<div class="dropdown" role="listbox">
			{#each supportedLanguages as lang}
				<button
					type="button"
					class="option"
					class:selected={lang === language}
					role="option"
					aria-selected={lang === language}
					onclick={() => handleSelect(lang)}
				>
					<span class="lang-code">{lang.toUpperCase()}</span>
					{#if !compact}
						<span class="lang-name">{languageNames[lang]}</span>
					{/if}
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
			aria-label="Close language selector"
		></button>
	{/if}
</div>

<style>
	.language-selector {
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
		left: 0;
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
	
	.lang-code {
		font-weight: 600;
	}
	
	.lang-name {
		color: var(--color-text-muted);
	}
	
	.compact .dropdown {
		min-width: 60px;
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
