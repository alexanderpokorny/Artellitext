<!--
  Artellico - Editor Page
  
  Block-based editor with Editor.js integration and LaTeX support.
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { createI18n } from '$stores/i18n.svelte';
	import type { PageData } from './$types';
	
	const { } = $props<{ data: PageData }>();
	
	const i18n = createI18n();
	
	// Editor state
	let editorContainer: HTMLElement;
	let editor: any = $state(null);
	let title = $state(i18n.t('editor.untitled'));
	let saveStatus = $state<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
	let wordCount = $state(0);
	let readingTime = $state(0);
	let tags = $state<string[]>([]);
	let newTag = $state('');
	let showReferencePanel = $state(false);
	
	// Initialize Editor.js on mount
	onMount(() => {
		if (!browser) return;
		
		// Dynamic import Editor.js and plugins
		const initEditor = async () => {
			const EditorJS = (await import('@editorjs/editorjs')).default;
			const Header = (await import('@editorjs/header')).default;
			const List = (await import('@editorjs/list')).default;
			const Quote = (await import('@editorjs/quote')).default;
			const Code = (await import('@editorjs/code')).default;
			
			editor = new EditorJS({
				holder: editorContainer,
				placeholder: i18n.t('editor.placeholder'),
				autofocus: true,
				tools: {
					header: {
						// @ts-expect-error Editor.js types are not fully compatible
						class: Header,
						config: {
							placeholder: 'Enter a header',
							levels: [1, 2, 3, 4],
							defaultLevel: 2,
						},
					},
					list: {
						// @ts-expect-error Editor.js types are not fully compatible
						class: List,
						inlineToolbar: true,
					},
					quote: {
						class: Quote,
						inlineToolbar: true,
					},
					code: Code,
					// LaTeX block would be implemented as a custom tool
					// math: MathTool,
				},
				onChange: async () => {
					saveStatus = 'unsaved';
					updateWordCount();
				},
			});
		};
		
		initEditor();
		
		return () => {
			editor?.destroy();
		};
	});
	
	// Calculate word count and reading time
	function updateWordCount() {
		// This would parse the editor content
		// For now, using placeholder values
		wordCount = Math.floor(Math.random() * 500) + 100;
		readingTime = Math.ceil(wordCount / 200);
	}
	
	// Auto-save functionality
	async function save() {
		if (!editor) return;
		
		saveStatus = 'saving';
		
		try {
			const content = await editor.save();
			
			// Send to server
			const response = await fetch('/api/notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					content,
					tags,
				}),
			});
			
			if (response.ok) {
				saveStatus = 'saved';
			} else {
				saveStatus = 'error';
			}
		} catch {
			saveStatus = 'error';
		}
	}
	
	// Add tag
	function addTag() {
		if (newTag.trim() && !tags.includes(newTag.trim())) {
			tags = [...tags, newTag.trim()];
			newTag = '';
		}
	}
	
	// Remove tag
	function removeTag(tag: string) {
		tags = tags.filter(t => t !== tag);
	}
	
	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key === 's') {
			event.preventDefault();
			save();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="editor-page">
	<!-- Editor header -->
	<header class="editor-header">
		<div class="header-left">
			<a href="/" class="back-btn" aria-label="Back to dashboard">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="15 18 9 12 15 6" />
				</svg>
			</a>
			
			<input
				type="text"
				class="title-input"
				bind:value={title}
				placeholder={i18n.t('editor.untitled')}
				aria-label="Note title"
			/>
		</div>
		
		<div class="header-right">
			<span class="save-status" class:saved={saveStatus === 'saved'} class:saving={saveStatus === 'saving'} class:error={saveStatus === 'error'}>
				{#if saveStatus === 'saved'}
					{i18n.t('editor.saved')}
				{:else if saveStatus === 'saving'}
					{i18n.t('editor.saving')}
				{:else if saveStatus === 'error'}
					{i18n.t('editor.error')}
				{:else}
					●
				{/if}
			</span>
			
			<button type="button" class="btn btn-ghost" onclick={() => showReferencePanel = !showReferencePanel}>
				{i18n.t('editor.references')}
			</button>
			
			<button type="button" class="btn btn-primary" onclick={save}>
				{i18n.t('action.save')}
			</button>
		</div>
	</header>
	
	<div class="editor-layout">
		<!-- Marginalia column (left) -->
		<aside class="marginalia-column">
			<!-- Marginalien would be rendered here -->
		</aside>
		
		<!-- Main editor -->
		<main class="editor-main">
			<div class="editor-container prose" bind:this={editorContainer}></div>
		</main>
		
		<!-- Tags column (right) -->
		<aside class="tags-column">
			<div class="tags-section">
				<h3 class="section-label">{i18n.t('editor.tags')}</h3>
				
				<div class="tags-list">
					{#each tags as tag}
						<span class="tag">
							{tag}
							<button type="button" class="tag-remove" onclick={() => removeTag(tag)} aria-label="Remove tag">
								×
							</button>
						</span>
					{/each}
				</div>
				
				<div class="add-tag">
					<input
						type="text"
						class="tag-input"
						bind:value={newTag}
						placeholder={i18n.t('editor.addTag')}
						onkeydown={(e) => e.key === 'Enter' && addTag()}
					/>
				</div>
			</div>
			
			<div class="meta-section">
				<div class="meta-item">
					<span class="meta-label">Wörter</span>
					<span class="meta-value">{wordCount}</span>
				</div>
				<div class="meta-item">
					<span class="meta-label">Lesezeit</span>
					<span class="meta-value">{readingTime} min</span>
				</div>
			</div>
		</aside>
		
		<!-- References panel (toggleable) -->
		{#if showReferencePanel}
			<aside class="references-panel">
				<header class="panel-header">
					<h3 class="panel-title">{i18n.t('editor.references')}</h3>
					<button type="button" class="close-btn" onclick={() => showReferencePanel = false}>
						×
					</button>
				</header>
				<div class="panel-content">
					<p class="empty-state">Noch keine Referenzen hinzugefügt</p>
				</div>
			</aside>
		{/if}
	</div>
</div>

<style>
	.editor-page {
		display: flex;
		flex-direction: column;
		height: calc(100vh - var(--header-height) - var(--status-bar-height));
		margin: calc(-1 * var(--site-padding));
		background: var(--color-bg-elevated);
	}
	
	/* Editor header */
	.editor-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-4);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-bg-elevated);
	}
	
	.header-left {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex: 1;
		min-width: 0;
	}
	
	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		color: var(--color-text-secondary);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}
	
	.back-btn:hover {
		color: var(--color-text);
		background: var(--color-bg-sunken);
	}
	
	.back-btn svg {
		width: 20px;
		height: 20px;
	}
	
	.title-input {
		flex: 1;
		min-width: 0;
		font-family: var(--font-human);
		font-size: var(--font-size-xl);
		font-weight: 500;
		color: var(--color-text);
		background: transparent;
		border: none;
		outline: none;
		padding: var(--space-2) 0;
	}
	
	.title-input::placeholder {
		color: var(--color-text-muted);
	}
	
	.header-right {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	
	.save-status {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	
	.save-status.saved {
		color: var(--color-success);
	}
	
	.save-status.saving {
		color: var(--color-warning);
	}
	
	.save-status.error {
		color: var(--color-error);
	}
	
	/* Editor layout */
	.editor-layout {
		display: grid;
		grid-template-columns: var(--margin-column-width) 1fr var(--tag-column-width);
		flex: 1;
		overflow: hidden;
	}
	
	.marginalia-column {
		padding: var(--space-6) var(--space-4);
		border-right: 1px solid var(--color-border-subtle);
		overflow-y: auto;
	}
	
	.editor-main {
		padding: var(--space-8);
		overflow-y: auto;
		display: flex;
		justify-content: center;
	}
	
	.editor-container {
		width: 100%;
		max-width: var(--content-max-width);
		min-height: 100%;
	}
	
	/* Editor.js styling */
	.editor-container :global(.ce-block__content) {
		max-width: 100%;
	}
	
	.editor-container :global(.ce-toolbar__content) {
		max-width: 100%;
	}
	
	.editor-container :global(.codex-editor__redactor) {
		padding-bottom: 200px;
	}
	
	/* Tags column */
	.tags-column {
		padding: var(--space-6) var(--space-4);
		border-left: 1px solid var(--color-border-subtle);
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}
	
	.section-label {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		font-weight: 600;
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin-bottom: var(--space-3);
	}
	
	.tags-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	
	.tag {
		display: inline-flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-1) var(--space-2);
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		background: var(--color-bg-sunken);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
	}
	
	.tag-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		margin-left: var(--space-1);
		background: transparent;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: 14px;
		line-height: 1;
	}
	
	.tag-remove:hover {
		color: var(--color-error);
	}
	
	.tag-input {
		width: 100%;
		padding: var(--space-2);
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text);
		background: var(--color-bg-sunken);
		border: none;
		border-radius: var(--radius-sm);
		outline: none;
		margin-top: var(--space-2);
	}
	
	.tag-input::placeholder {
		color: var(--color-text-muted);
	}
	
	/* Meta section */
	.meta-section {
		margin-top: auto;
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-border-subtle);
	}
	
	.meta-item {
		display: flex;
		justify-content: space-between;
		padding: var(--space-1) 0;
	}
	
	.meta-label,
	.meta-value {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	
	/* References panel */
	.references-panel {
		position: fixed;
		top: var(--header-height);
		right: 0;
		bottom: var(--status-bar-height);
		width: 320px;
		background: var(--color-bg-elevated);
		border-left: 1px solid var(--color-border);
		z-index: var(--z-fixed);
		display: flex;
		flex-direction: column;
	}
	
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4);
		border-bottom: 1px solid var(--color-border);
	}
	
	.panel-title {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		font-weight: 600;
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
	}
	
	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: transparent;
		border: none;
		color: var(--color-text-muted);
		font-size: 20px;
		cursor: pointer;
		border-radius: var(--radius-sm);
	}
	
	.close-btn:hover {
		color: var(--color-text);
		background: var(--color-bg-sunken);
	}
	
	.panel-content {
		flex: 1;
		padding: var(--space-4);
		overflow-y: auto;
	}
	
	.empty-state {
		font-family: var(--font-human);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		text-align: center;
		padding: var(--space-8);
	}
	
	@media (max-width: 1024px) {
		.editor-layout {
			grid-template-columns: 1fr;
		}
		
		.marginalia-column,
		.tags-column {
			display: none;
		}
	}
</style>
