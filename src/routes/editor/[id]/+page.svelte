<!--
  Artellico - Editor Page (Existing Note)
  
  Block-based editor for editing existing notes.
  Features: Marginalia, Tags, Full-width toggle, Offline-first saving.
-->

<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { createI18n } from '$stores/i18n.svelte';
	import type { MarginaliaNote } from '$lib/types';
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
	
	const i18n = createI18n();
	
	// Note data from server
	const noteId = $derived(data.note?.id);
	
	// Editor state
	let editorContainer: HTMLElement;
	let marginaliaColumn: HTMLElement;
	let editor: any = $state(null);
	let title = $state(data.note?.title || i18n.t('editor.untitled'));
	let saveStatus = $state<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
	let wordCount = $state(data.note?.word_count || 0);
	let readingTime = $state(data.note?.reading_time || 0);
	let tags = $state<string[]>(data.note?.tags || []);
	let newTag = $state('');
	let showReferencePanel = $state(false);
	let fullWidth = $state(true);
	
	// Marginalia state
	let marginalia = $state<MarginaliaNote[]>([]);
	let editingMarginaliaId = $state<string | null>(null);
	let draggingMarginaliaId = $state<string | null>(null);
	let showContextMenu = $state(false);
	let contextMenuPosition = $state({ x: 0, y: 0 });
	let contextMenuTargetId = $state<string | null>(null);
	
	// Return to dashboard (exit fullscreen mode)
	async function exitToInline() {
		if (saveStatus === 'unsaved' && editor) {
			await save();
		}
		goto('/');
	}
	
	// Toggle full width mode
	function toggleFullWidth() {
		fullWidth = !fullWidth;
	}
	
	// Add marginalia at click position in column
	function handleMarginaliaColumnClick(e: MouseEvent) {
		if (editingMarginaliaId) return;
		if ((e.target as HTMLElement).closest('.marginalia-note')) return;
		
		const rect = marginaliaColumn.getBoundingClientRect();
		const clickY = e.clientY - rect.top + marginaliaColumn.scrollTop;
		
		let blockId = 'block-0';
		if (editor && editorContainer) {
			const blocks = editorContainer.querySelectorAll('.ce-block');
			const containerRect = editorContainer.getBoundingClientRect();
			
			blocks.forEach((block, index) => {
				const blockRect = block.getBoundingClientRect();
				const relativeTop = blockRect.top - containerRect.top + editorContainer.scrollTop;
				if (clickY >= relativeTop) {
					const editorBlock = editor.blocks.getBlockByIndex(index);
					blockId = editorBlock?.id || `block-${index}`;
				}
			});
		}
		
		const newNote: MarginaliaNote = {
			id: crypto.randomUUID(),
			blockId,
			content: '',
			top: clickY,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		
		marginalia = [...marginalia, newNote];
		editingMarginaliaId = newNote.id;
		saveStatus = 'unsaved';
	}
	
	// Update marginalia content
	function updateMarginaliaContent(id: string, content: string) {
		marginalia = marginalia.map(m =>
			m.id === id ? { ...m, content, updatedAt: new Date() } : m
		);
		saveStatus = 'unsaved';
	}
	
	// Delete marginalia via context menu
	function deleteMarginalia(id: string) {
		marginalia = marginalia.filter(m => m.id !== id);
		closeContextMenu();
		saveStatus = 'unsaved';
	}
	
	// Handle right-click on marginalia
	function handleMarginaliaContextMenu(e: MouseEvent, id: string) {
		e.preventDefault();
		e.stopPropagation();
		contextMenuPosition = { x: e.clientX, y: e.clientY };
		contextMenuTargetId = id;
		showContextMenu = true;
	}
	
	// Close context menu
	function closeContextMenu() {
		showContextMenu = false;
		contextMenuTargetId = null;
	}
	
	// Marginalia drag handlers
	function handleMarginaliaDragStart(e: MouseEvent, id: string) {
		draggingMarginaliaId = id;
		e.preventDefault();
	}
	
	function handleMarginaliaDrag(e: MouseEvent) {
		if (!draggingMarginaliaId || !marginaliaColumn) return;
		
		const rect = marginaliaColumn.getBoundingClientRect();
		const newTop = Math.max(0, e.clientY - rect.top + marginaliaColumn.scrollTop);
		
		marginalia = marginalia.map(m =>
			m.id === draggingMarginaliaId ? { ...m, top: newTop, updatedAt: new Date() } : m
		);
	}
	
	function handleMarginaliaDragEnd() {
		if (draggingMarginaliaId) {
			draggingMarginaliaId = null;
			saveStatus = 'unsaved';
		}
	}
	
	// Sync marginalia positions with editor blocks
	async function syncMarginaliaPositions() {
		if (!editor || !editorContainer) return;
		await tick();
		
		const blocks = editorContainer.querySelectorAll('.ce-block');
		const containerRect = editorContainer.getBoundingClientRect();
		const positions = new Map<string, number>();
		
		blocks.forEach((block, index) => {
			const blockRect = block.getBoundingClientRect();
			const relativeTop = blockRect.top - containerRect.top + editorContainer.scrollTop;
			const editorBlock = editor.blocks.getBlockByIndex(index);
			const blockId = editorBlock?.id || `block-${index}`;
			positions.set(blockId, relativeTop);
		});
		
		marginalia = marginalia.map(m => {
			const blockTop = positions.get(m.blockId);
			if (blockTop !== undefined) {
				return { ...m, top: blockTop };
			}
			return m;
		});
	}
	
	// Initialize Editor.js on mount with existing content
	onMount(() => {
		if (!browser) return;
		
		const initEditor = async () => {
			const EditorJS = (await import('@editorjs/editorjs')).default;
			const Header = (await import('@editorjs/header')).default;
			const List = (await import('@editorjs/list')).default;
			const Quote = (await import('@editorjs/quote')).default;
			// @ts-expect-error No type declarations available
			const DragDrop = (await import('editorjs-drag-drop')).default;
			
			const { MathTool, MathInlineTool, MathParagraph, CodeTool, MermaidTool, CitationTool, BibliographyTool } = await import('$lib/editor/tools');
			await import('katex/dist/katex.min.css');
			await import('highlight.js/styles/github-dark.css');
			
			// Load existing content or start fresh
			const existingContent = data.note?.content;
			
			editor = new EditorJS({
				holder: editorContainer,
				placeholder: i18n.t('editor.placeholder'),
				autofocus: true,
				data: existingContent || undefined,
				defaultBlock: 'paragraph',
				inlineToolbar: ['bold', 'italic', 'link', 'mathInline'],
				tools: {
					paragraph: {
						// @ts-expect-error Custom tool
						class: MathParagraph,
						inlineToolbar: true,
					},
					header: {
						// @ts-expect-error Editor.js types
						class: Header,
						config: { levels: [1, 2, 3, 4], defaultLevel: 2 },
					},
					list: {
						// @ts-expect-error Editor.js types
						class: List,
						inlineToolbar: true,
					},
					quote: { class: Quote, inlineToolbar: true },
					code: {
						// @ts-expect-error Custom tool
						class: CodeTool,
					},
					math: {
						// @ts-expect-error Custom tool
						class: MathTool,
						config: { placeholder: 'LaTeX (e.g., E = mc^2)' },
					},
					mathInline: {
						class: MathInlineTool,
					},
					mermaid: {
						// @ts-expect-error Custom tool
						class: MermaidTool,
						config: { placeholder: 'Mermaid diagram' },
					},
					citation: {
						// @ts-expect-error Custom tool
						class: CitationTool,
						config: { defaultStyle: 'apa' },
					},
					bibliography: {
						// @ts-expect-error Custom tool
						class: BibliographyTool,
						config: { defaultStyle: 'apa', defaultTitle: 'References' },
					},
				},
				onChange: async () => {
					saveStatus = 'unsaved';
					updateWordCount();
					syncMarginaliaPositions();
				},
				onReady: () => {
					new DragDrop(editor);
					setTimeout(syncMarginaliaPositions, 100);
				},
			});
		};
		
		initEditor();
		
		// Close context menu on click outside
		const handleClickOutside = (e: MouseEvent) => {
			if (showContextMenu && !(e.target as HTMLElement).closest('.context-menu')) {
				closeContextMenu();
			}
		};
		document.addEventListener('click', handleClickOutside);
		
		return () => {
			editor?.destroy();
			document.removeEventListener('click', handleClickOutside);
		};
	});
	
	// Show BibTeX import dialog
	async function openBibImport() {
		const { showBibImportDialog } = await import('$lib/editor/tools');
		showBibImportDialog((citations) => {
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
		});
	}
	
	// Calculate word count from editor content
	async function updateWordCount() {
		if (!editor) return;
		try {
			const content = await editor.save();
			let count = 0;
			for (const block of content.blocks) {
				if (block.data?.text) {
					count += String(block.data.text).replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
				}
			}
			wordCount = count;
			readingTime = Math.ceil(count / 200);
		} catch {
			// Ignore errors during word count
		}
	}
	
	// Save with offline-first approach (update existing note)
	async function save() {
		if (!editor || !noteId) return;
		
		saveStatus = 'saving';
		
		try {
			const content = await editor.save();
			const noteData = { title, content, tags };
			
			// Save to local cache first
			if (browser) {
				const { saveNoteToCache } = await import('$stores/offline');
				await saveNoteToCache({ ...noteData, noteId, marginalia });
			}
			
			// Sync to server (update existing)
			await fetch(`/api/notes/${noteId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(noteData),
			});
			
			saveStatus = 'saved';
		} catch (err) {
			console.error('Save failed:', err);
			saveStatus = 'error';
		}
	}
	
	// Tag management
	function addTag() {
		if (newTag.trim() && !tags.includes(newTag.trim())) {
			tags = [...tags, newTag.trim()];
			newTag = '';
			saveStatus = 'unsaved';
		}
	}
	
	function removeTag(tag: string) {
		tags = tags.filter(t => t !== tag);
		saveStatus = 'unsaved';
	}
	
	// Keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key === 's') {
			event.preventDefault();
			save();
		}
		if (event.key === 'Escape') {
			if (showContextMenu) {
				closeContextMenu();
			} else {
				// ESC exits to dashboard
				exitToInline();
			}
		}
	}
	
	// Sorted marginalia
	const sortedMarginalia = $derived([...marginalia].sort((a, b) => a.top - b.top));
</script>

<svelte:window 
	onkeydown={handleKeydown}
	onmousemove={handleMarginaliaDrag}
	onmouseup={handleMarginaliaDragEnd}
/>

<div class="editor-page is-fullscreen" class:full-width={fullWidth}>
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
				onblur={save}
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
			
			<button type="button" class="btn btn-ghost" onclick={openBibImport}>
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
			
			<!-- Full width toggle -->
			<button 
				type="button" 
				class="btn btn-icon" 
				onclick={toggleFullWidth}
				aria-label={fullWidth ? i18n.t('editor.narrowWidth') : i18n.t('editor.fullWidthToggle')}
			>
				{#if fullWidth}
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="21" y1="6" x2="3" y2="6"/>
						<line x1="17" y1="12" x2="7" y2="12"/>
						<line x1="21" y1="18" x2="3" y2="18"/>
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="21" y1="6" x2="3" y2="6"/>
						<line x1="21" y1="12" x2="3" y2="12"/>
						<line x1="21" y1="18" x2="3" y2="18"/>
					</svg>
				{/if}
			</button>
			
			<!-- Exit fullscreen (return to dashboard with inline editor) -->
			<button 
				type="button" 
				class="btn btn-icon fullscreen-btn active" 
				onclick={exitToInline}
				aria-label={i18n.t('editor.exitFullscreen')}
				title={i18n.t('editor.exitFullscreen')}
			>
				<!-- Exit fullscreen icon (arrows pointing inward) -->
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M8 3v3a2 2 0 0 1-2 2H3" />
					<path d="M21 8h-3a2 2 0 0 1-2-2V3" />
					<path d="M3 16h3a2 2 0 0 1 2 2v3" />
					<path d="M16 21v-3a2 2 0 0 1 2-2h3" />
				</svg>
			</button>
			
			<button type="button" class="btn btn-primary" onclick={save}>
				{i18n.t('action.save')}
			</button>
		</div>
	</header>
	
	<div class="editor-layout">
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<!-- Marginalia column (left) -->
		<div 
			class="marginalia-column"
			bind:this={marginaliaColumn}
			onclick={handleMarginaliaColumnClick}
			onkeydown={(e) => e.key === 'Enter' && handleMarginaliaColumnClick(e as unknown as MouseEvent)}
			role="region"
			aria-label="Marginalia"
			tabindex="-1"
			title={i18n.t('editor.newMarginalia')}
		>
			{#each sortedMarginalia as note (note.id)}
				<div
					class="marginalia-note"
					class:editing={editingMarginaliaId === note.id}
					class:dragging={draggingMarginaliaId === note.id}
					style="top: {note.top}px"
					oncontextmenu={(e) => handleMarginaliaContextMenu(e, note.id)}
					role="group"
					aria-label="Marginal note"
				>
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<div 
						class="marginalia-drag-handle"
						onmousedown={(e) => handleMarginaliaDragStart(e, note.id)}
						role="separator"
						aria-orientation="vertical"
						tabindex="-1"
					></div>
					
					<textarea
						class="marginalia-textarea"
						value={note.content}
						placeholder={i18n.t('editor.marginalia') + '...'}
						oninput={(e) => updateMarginaliaContent(note.id, e.currentTarget.value)}
						onfocus={() => editingMarginaliaId = note.id}
						onblur={() => setTimeout(() => editingMarginaliaId = null, 100)}
						onclick={(e) => e.stopPropagation()}
					></textarea>
				</div>
			{/each}
		</div>
		
		<!-- Main editor -->
		<main class="editor-main">
			<div class="editor-container prose" bind:this={editorContainer}></div>
		</main>
		
		<!-- Tags column (right) -->
		<aside class="tags-column">
			<div class="tags-section">
				<div class="tags-list">
					{#each tags as tag}
						<span class="tag">
							{tag}
							<button type="button" class="tag-remove" onclick={() => removeTag(tag)} aria-label={i18n.t('action.delete')}>
								×
							</button>
						</span>
					{/each}
				</div>
				
				<input
					type="text"
					class="tag-input"
					bind:value={newTag}
					placeholder={i18n.t('editor.addTag')}
					onkeydown={(e) => e.key === 'Enter' && addTag()}
				/>
			</div>
			
			<div class="meta-section">
				<div class="meta-item">
					<span class="meta-label">{i18n.t('editor.wordCount', { count: wordCount })}</span>
				</div>
				<div class="meta-item">
					<span class="meta-label">{i18n.t('editor.readingTime', { minutes: readingTime })}</span>
				</div>
			</div>
		</aside>
		
		<!-- References panel -->
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
	
	<!-- Context menu for marginalia -->
	{#if showContextMenu}
		<div 
			class="context-menu"
			style="left: {contextMenuPosition.x}px; top: {contextMenuPosition.y}px"
		>
			<button 
				type="button"
				class="context-menu-item"
				onclick={() => contextMenuTargetId && deleteMarginalia(contextMenuTargetId)}
			>
				{i18n.t('action.delete')}
			</button>
		</div>
	{/if}
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
	
	.fullscreen-btn,
	.btn.btn-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		padding: 0;
		color: var(--color-text-secondary);
	}
	
	.fullscreen-btn:hover,
	.btn.btn-icon:hover {
		color: var(--color-text);
		background: var(--color-bg-sunken);
	}
	
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
	
	.save-status.saved { color: var(--color-success); }
	.save-status.saving { color: var(--color-warning); }
	.save-status.error { color: var(--color-error); }
	
	.editor-layout {
		display: grid;
		grid-template-columns: var(--margin-column-width) 1fr var(--tag-column-width);
		flex: 1;
		overflow: hidden;
	}
	
	.marginalia-column {
		position: relative;
		padding: var(--space-4);
		border-right: 1px solid var(--color-border-subtle);
		overflow-y: auto;
		cursor: crosshair;
	}
	
	.marginalia-note {
		position: absolute;
		left: var(--space-2);
		right: var(--space-2);
		display: flex;
		transition: box-shadow var(--transition-fast);
	}
	
	.marginalia-drag-handle {
		width: 3px;
		background: transparent;
		cursor: grab;
		flex-shrink: 0;
		transition: background var(--transition-fast);
	}
	
	.marginalia-note:hover .marginalia-drag-handle,
	.marginalia-note.dragging .marginalia-drag-handle {
		background: var(--color-active);
		cursor: grabbing;
	}
	
	.marginalia-note.editing .marginalia-drag-handle {
		background: var(--color-active);
	}
	
	.marginalia-textarea {
		flex: 1;
		min-height: 24px;
		padding: var(--space-1) var(--space-2);
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-relaxed);
		color: var(--color-text-secondary);
		background: transparent;
		border: none;
		outline: none;
		resize: none;
		overflow: hidden;
		field-sizing: content;
	}
	
	.marginalia-textarea:focus {
		color: var(--color-text);
	}
	
	.marginalia-textarea::placeholder {
		color: var(--color-text-muted);
	}
	
	.editor-main {
		padding: var(--space-8);
		overflow-y: auto;
		display: flex;
		justify-content: center;
	}
	
	.editor-container {
		width: 100%;
		min-height: 100%;
	}
	
	.editor-page:not(.full-width) .editor-container {
		max-width: var(--content-max-width);
	}
	
	.editor-container :global(.ce-block__content) {
		max-width: 100%;
	}
	
	.editor-container :global(.ce-toolbar__content) {
		max-width: 100%;
	}
	
	.editor-container :global(.codex-editor__redactor) {
		padding-bottom: 200px;
	}
	
	.editor-container :global(.ce-toolbar__actions) {
		cursor: grab;
	}
	
	.tags-column {
		padding: var(--space-4);
		border-left: 1px solid var(--color-border-subtle);
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.tags-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	
	.tags-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
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
	}
	
	.tag-input::placeholder {
		color: var(--color-text-muted);
	}
	
	.meta-section {
		margin-top: auto;
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-border-subtle);
	}
	
	.meta-item {
		padding: var(--space-1) 0;
	}
	
	.meta-label {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	
	.context-menu {
		position: fixed;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: var(--z-dropdown);
		min-width: 120px;
	}
	
	.context-menu-item {
		display: block;
		width: 100%;
		padding: var(--space-2) var(--space-3);
		text-align: left;
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		color: var(--color-text);
		background: transparent;
		border: none;
		cursor: pointer;
	}
	
	.context-menu-item:hover {
		background: var(--color-bg-hover);
		color: var(--color-error);
	}
	
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
