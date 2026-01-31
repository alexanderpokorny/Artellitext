<!--
  Artellico - Editor Sidebar Component
  
  Flexible tabbed sidebar for editor panels.
  Supports both left and right positioning with different tab configurations.
  
  Props:
    - side: 'left' | 'right' - Which side of the editor
    - tabs: Array of tab configurations
    - activeTab: Currently active tab id
    - stickyContent: boolean - Whether content should be sticky (scrolls with header)
    - showTabsOnly: boolean - Only render the tab bar (for unified header layout)
-->

<script lang="ts">
	import { createI18n } from '$stores/i18n.svelte';
	
	interface Tab {
		id: string;
		icon: string;
		tooltipKey: string;
	}
	
	interface Props {
		side: 'left' | 'right';
		tabs: Tab[];
		activeTab: string;
		onTabChange: (tabId: string) => void;
		children?: any;
		stickyContent?: boolean;
		showTabsOnly?: boolean;
	}
	
	let { side, tabs, activeTab, onTabChange, children, stickyContent = false, showTabsOnly = false }: Props = $props();
	
	const i18n = createI18n();
</script>

{#if showTabsOnly}
	<!-- Only render tab bar for unified header -->
	<div class="sidebar-tabs-standalone" class:left={side === 'left'} class:right={side === 'right'} role="tablist">
		{#each tabs as tab}
			<button
				type="button"
				role="tab"
				class="sidebar-tab"
				class:active={activeTab === tab.id}
				onclick={() => onTabChange(tab.id)}
				title={i18n.t(tab.tooltipKey as any)}
				aria-label={i18n.t(tab.tooltipKey as any)}
				aria-selected={activeTab === tab.id}
			>
				{@html tab.icon}
			</button>
		{/each}
	</div>
{:else}
	<aside class="editor-sidebar" class:left={side === 'left'} class:right={side === 'right'} class:sticky-content={stickyContent}>
		<!-- Tab content only (tabs are in unified header) -->
		<div class="sidebar-content" class:sticky={stickyContent} role="tabpanel">
			{#if children}
				{@render children()}
			{/if}
		</div>
	</aside>
{/if}

<style>
	/* Standalone tabs for unified header */
	.sidebar-tabs-standalone {
		display: flex;
		gap: 0;
		background: var(--color-bg-sunken);
		height: 100%;
	}
	
	/* Dark mode tab bar background */
	:global(html.dark) .sidebar-tabs-standalone {
		background: #242424;
	}
	
	.sidebar-tabs-standalone.left {
		border-right: 1px solid var(--color-border-subtle);
	}
	
	.sidebar-tabs-standalone.right {
		border-left: 1px solid var(--color-border-subtle);
	}
	
	:global(html.dark) .sidebar-tabs-standalone.left,
	:global(html.dark) .sidebar-tabs-standalone.right {
		border-color: #333;
	}
	
	.sidebar-tab {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-2) var(--space-3);
		background: transparent;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.sidebar-tab:hover {
		color: var(--color-text);
		background: var(--color-bg-hover);
	}
	
	.sidebar-tab.active {
		color: var(--color-accent);
		background: var(--color-bg-elevated);
	}
	
	.sidebar-tab :global(svg) {
		width: 18px;
		height: 18px;
	}
	
	/* Full sidebar (content only, tabs in header) */
	.editor-sidebar {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--color-bg-elevated);
		overflow: hidden;
	}
	
	/* Dark mode sidebar background */
	:global(html.dark) .editor-sidebar {
		background: #242424;
	}
	
	.editor-sidebar.left {
		border-right: 1px solid var(--color-border-subtle);
	}
	
	.editor-sidebar.right {
		border-left: 1px solid var(--color-border-subtle);
	}
	
	:global(html.dark) .editor-sidebar.left,
	:global(html.dark) .editor-sidebar.right {
		border-color: #333;
	}
	
	.sidebar-content {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-3);
	}
	
	/* Sticky content scrolls with header */
	.sidebar-content.sticky {
		position: sticky;
		top: 0;
		overflow-y: visible;
		max-height: calc(80vh - 50px);
		overflow-y: auto;
	}
</style>
