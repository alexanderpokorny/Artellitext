<!--
  Artellico - Editor Sidebar Component
  
  Flexible tabbed sidebar for editor panels.
  Supports both left and right positioning with different tab configurations.
  
  Props:
    - side: 'left' | 'right' - Which side of the editor
    - tabs: Array of tab configurations
    - activeTab: Currently active tab id
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
		children: any;
	}
	
	let { side, tabs, activeTab, onTabChange, children }: Props = $props();
	
	const i18n = createI18n();
</script>

<aside class="editor-sidebar" class:left={side === 'left'} class:right={side === 'right'}>
	<!-- Tab bar -->
	<div class="sidebar-tabs" role="tablist">
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
	
	<!-- Tab content -->
	<div class="sidebar-content" role="tabpanel">
		{@render children()}
	</div>
</aside>

<style>
	.editor-sidebar {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--color-bg-elevated);
		overflow: hidden;
	}
	
	.editor-sidebar.left {
		border-right: 1px solid var(--color-border-subtle);
	}
	
	.editor-sidebar.right {
		border-left: 1px solid var(--color-border-subtle);
	}
	
	.sidebar-tabs {
		display: flex;
		gap: 0;
		padding: 0;
		border-bottom: 1px solid var(--color-border-subtle);
		background: var(--color-bg-sunken);
	}
	
	.sidebar-tab {
		flex: 1;
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
		border-bottom: 2px solid var(--color-accent);
		margin-bottom: -1px;
	}
	
	.sidebar-tab :global(svg) {
		width: 18px;
		height: 18px;
	}
	
	.sidebar-content {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-3);
	}
</style>
