<!--
  Artellico - Editor Page
  
  Block-based editor with Editor.js integration and LaTeX support.
-->

<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { createI18n } from '$stores/i18n.svelte';
	import Marginalia from '$lib/components/editor/Marginalia.svelte';
	import type { MarginaliaNote } from '$lib/types';
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
	let isFullscreen = $state(false);
	
	// Marginalia state
	let marginalia = $state<MarginaliaNote[]>([]);
	let marginaliaComponent: Marginalia;
	
	// Toggle fullscreen mode
	function toggleFullscreen() {
		isFullscreen = !isFullscreen;
	}
	
	// Add marginalia for current block
	async function addMarginaliaForCurrentBlock() {
		if (!editor) return;
		
		const currentBlockIndex = editor.blocks.getCurrentBlockIndex();
		if (currentBlockIndex < 0) return;
		
		// Get the block element to determine position
		const blocks = editorContainer.querySelectorAll('.ce-block');
		const currentBlock = blocks[currentBlockIndex] as HTMLElement;
		
		if (currentBlock && marginaliaComponent) {
			const blockRect = currentBlock.getBoundingClientRect();
			const containerRect = editorContainer.getBoundingClientRect();
			const relativeTop = blockRect.top - containerRect.top + editorContainer.scrollTop;
			
			// Get block ID from Editor.js
			const blockId = editor.blocks.getBlockByIndex(currentBlockIndex)?.id || `block-${currentBlockIndex}`;
			
			marginaliaComponent.addNote(blockId, relativeTop);
			saveStatus = 'unsaved';
		}
	}
	
	// Sync marginalia positions with editor blocks
	async function syncMarginaliaPositions() {
		if (!editor || !editorContainer || !marginaliaComponent) return;
		
		await tick();
		
		const blocks = editorContainer.querySelectorAll('.ce-block');
		const containerRect = editorContainer.getBoundingClientRect();
		const positions = new Map<string, number>();
		
		blocks.forEach((block, index) => {
			const blockEl = block as HTMLElement;
			const blockRect = blockEl.getBoundingClientRect();
			const relativeTop = blockRect.top - containerRect.top + editorContainer.scrollTop;
			
			// Try to get block ID from Editor.js
			const editorBlock = editor.blocks.getBlockByIndex(index);
			const blockId = editorBlock?.id || `block-${index}`;
			positions.set(blockId, relativeTop);
		});
		
		marginaliaComponent.syncPositions(positions);
	}
	
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
			
			// Import custom tools
			const { MathTool, MermaidTool, CitationTool, BibliographyTool } = await import('$lib/editor/tools');
			
			// Import KaTeX CSS
			await import('katex/dist/katex.min.css');
			
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
					// LaTeX / Math formulas
					math: {
						// @ts-expect-error Custom tool
						class: MathTool,
						config: {
							placeholder: 'Enter LaTeX formula (e.g., E = mc^2)',
						},
					},
					// Mermaid diagrams
					mermaid: {
						// @ts-expect-error Custom tool
						class: MermaidTool,
						config: {
							placeholder: 'Enter Mermaid diagram code',
						},
					},
					// Citations
					citation: {
						// @ts-expect-error Custom tool
						class: CitationTool,
						config: {
							defaultStyle: 'apa',
							availableStyles: ['apa', 'ieee', 'chicago-author-date', 'harvard1', 'vancouver'],
						},
					},
					// Bibliography (auto-generated from citations)
					bibliography: {
						// @ts-expect-error Custom tool
						class: BibliographyTool,
						config: {
							defaultStyle: 'apa',
							availableStyles: ['apa', 'ieee', 'chicago-author-date', 'harvard1', 'vancouver'],
							defaultTitle: 'References',
						},
					},
				},
				onChange: async () => {
					saveStatus = 'unsaved';
					updateWordCount();
					// Sync marginalia positions when blocks change
					syncMarginaliaPositions();
				},
			});
			
			// Initial sync after editor is ready
			setTimeout(syncMarginaliaPositions, 500);
		};
		
		initEditor();
		
		return () => {
			editor?.destroy();
		};
	});
	
	// Show BibTeX import dialog
	async function openBibImport() {
		const { showBibImportDialog } = await import('$lib/editor/tools');
		showBibImportDialog((citations) => {
			// Save imported citations to literature database
			citations.forEach(async (citation) => {
				try {
					await fetch('/api/literature', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							cslJson: citation.cslJson,
							bibtex: citation.bibtex,
							title: citation.title,
							authors: citation.authors,
							year: citation.year,
						}),
					});
				} catch (err) {
					console.error('Failed to save citation:', err);
				}
			});
			// Notify user
			alert(`${citations.length} citation(s) imported successfully.`);
		});
	}
	
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
			
			// Send to server (including marginalia)
			const response = await fetch('/api/notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					content,
					tags,
					marginalia,
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
		// Escape exits fullscreen
		if (event.key === 'Escape' && isFullscreen) {
			isFullscreen = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="editor-page" class:fullscreen={isFullscreen}>
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
			
			<button type="button" class="btn btn-ghost" onclick={openBibImport} title="Import BibTeX references">
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: middle;">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
					<polyline points="17 8 12 3 7 8"/>
					<line x1="12" y1="3" x2="12" y2="15"/>
				</svg>
				BibTeX
			</button>
			
			<button type="button" class="btn btn-ghost" onclick={() => showReferencePanel = !showReferencePanel}>
				{i18n.t('editor.references')}
			</button>
			
			<!-- Fullscreen toggle button -->
			<button 
				type="button" 
				class="btn btn-icon fullscreen-btn" 
				onclick={toggleFullscreen}
				title={isFullscreen ? i18n.t('editor.exitFullscreen') : i18n.t('editor.fullscreen')}
				aria-label={isFullscreen ? i18n.t('editor.exitFullscreen') : i18n.t('editor.fullscreen')}
			>
				{#if isFullscreen}
					<!-- Minimize icon -->
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M8 3v3a2 2 0 0 1-2 2H3" />
						<path d="M21 8h-3a2 2 0 0 1-2-2V3" />
						<path d="M3 16h3a2 2 0 0 1 2 2v3" />
						<path d="M16 21v-3a2 2 0 0 1 2-2h3" />
					</svg>
				{:else}
					<!-- Maximize icon -->
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M8 3H5a2 2 0 0 0-2 2v3" />
						<path d="M21 8V5a2 2 0 0 0-2-2h-3" />
						<path d="M3 16v3a2 2 0 0 0 2 2h3" />
						<path d="M16 21h3a2 2 0 0 0 2-2v-3" />
					</svg>
				{/if}
			</button>
			
			<button type="button" class="btn btn-primary" onclick={save}>
				{i18n.t('action.save')}
			</button>
		</div>
	</header>
	
	<div class="editor-layout">
		<!-- Marginalia column (left) -->
		<aside class="marginalia-column">
			<div class="marginalia-header">
				<h3 class="section-label">{i18n.t('editor.marginalia')}</h3>
				<button 
					type="button" 
					class="add-marginalia-btn"
					onclick={addMarginaliaForCurrentBlock}
					title={i18n.t('editor.addMarginalia')}
					aria-label={i18n.t('editor.addMarginalia')}
				>
					<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="12" y1="5" x2="12" y2="19"/>
						<line x1="5" y1="12" x2="19" y2="12"/>
					</svg>
				</button>
			</div>
			<Marginalia 
				bind:this={marginaliaComponent}
				bind:marginalia={marginalia}
			/>
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
		transition: all var(--transition-normal);
	}
	
	/* Fullscreen mode */
	.editor-page.fullscreen {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		height: 100vh;
		margin: 0;
		z-index: var(--z-modal);
	}
	
	.editor-page.fullscreen .marginalia-column,
	.editor-page.fullscreen .tags-column {
		display: none;
	}
	
	.editor-page.fullscreen .editor-layout {
		grid-template-columns: 1fr;
	}
	
	.editor-page.fullscreen .editor-main {
		padding: var(--space-8) var(--space-12);
	}
	
	/* Fullscreen button */
	.fullscreen-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		padding: 0;
		color: var(--color-text-secondary);
	}
	
	.fullscreen-btn:hover {
		color: var(--color-text);
		background: var(--color-bg-sunken);
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
		padding: var(--space-4);
		border-right: 1px solid var(--color-border-subtle);
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}
	
	/* Marginalia header */
	.marginalia-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-3);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--color-border-subtle);
	}
	
	.add-marginalia-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.add-marginalia-btn:hover {
		color: var(--color-text);
		background: var(--color-bg-sunken);
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
