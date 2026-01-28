<!--
  Artellico - Dashboard (Home Page)
  
  Landing page showing recent notes, quick actions, and statistics.
  Features: Embedded QuickEdit editor with marginalia, tags, and autosave on blur.
  Notes list with multiple view modes and lazy loading.
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { createI18n } from '$stores/i18n.svelte';
	import type { MarginaliaNote } from '$lib/types';
	
	let { data }: { data: PageData } = $props();
	const userData = $derived(data.user);
	
	const i18n = createI18n();
	
	// QuickEdit editor state
	let editorContainer: HTMLElement;
	let quickEditor: any = $state(null);
	let isEditorActive = $state(false);
	let isEditorLoading = $state(false);
	let quickNoteTitle = $state('');
	let saveStatus = $state<'saved' | 'saving' | 'unsaved' | 'idle'>('idle');
	
	// Marginalia state (for future use in full editor)
	let marginalia = $state<MarginaliaNote[]>([]);
	let draggingMarginaliaId = $state<string | null>(null);
	let showContextMenu = $state(false);
	let contextMenuPosition = $state({ x: 0, y: 0 });
	let contextMenuTargetId = $state<string | null>(null);
	
	// Tags state (for future use)
	let tags = $state<string[]>([]);
	
	// Notes list state
	type ViewMode = 'list' | 'grid-small' | 'grid-large' | 'expanded';
	type SortBy = 'updated' | 'created' | 'title' | 'words';
	type SortOrder = 'asc' | 'desc';
	
	type NoteItem = {
		id: string;
		title: string;
		excerpt: string | null;
		content: any;
		tags: string[];
		word_count: number;
		updated_at: string;
		created_at: string;
	};
	
	let notes = $state<NoteItem[]>((data.recentNotes as NoteItem[]) || []);
	
	let viewMode = $state<ViewMode>('grid-small');
	let sortBy = $state<SortBy>('updated');
	let sortOrder = $state<SortOrder>('desc');
	let isLoadingMore = $state(false);
	let hasMore = $state(true);
	let currentPage = $state(1);
	let expandedNoteId = $state<string | null>(null);
	let loadMoreTrigger = $state<HTMLElement | null>(null);
	
	// Stats from server
	const stats = $derived({
		notes: data.stats?.notes ?? 0,
		documents: data.stats?.documents ?? 0,
		storage: '—',
	});
	
	const welcomeMessage = $derived(
		userData?.displayName 
			? i18n.t('dashboard.welcome', { name: userData.displayName })
			: i18n.t('dashboard.welcome', { name: userData?.username || 'User' })
	);
	
	// Sorted notes
	const sortedNotes = $derived(() => {
		const sorted = [...notes].sort((a, b) => {
			let comparison = 0;
			switch (sortBy) {
				case 'updated':
					comparison = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
					break;
				case 'created':
					comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
					break;
				case 'title':
					comparison = (a.title || '').localeCompare(b.title || '');
					break;
				case 'words':
					comparison = (b.word_count || 0) - (a.word_count || 0);
					break;
			}
			return sortOrder === 'desc' ? comparison : -comparison;
		});
		return sorted;
	});
	
	function formatTimeAgo(date: Date | string): string {
		const d = typeof date === 'string' ? new Date(date) : date;
		const diff = Date.now() - d.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);
		
		if (minutes < 60) return i18n.t('time.minutesAgo', { minutes });
		if (hours < 24) return i18n.t('time.hoursAgo', { hours });
		return i18n.t('time.daysAgo', { days });
	}
	
	// Load more notes (lazy loading)
	async function loadMoreNotes() {
		if (isLoadingMore || !hasMore) return;
		
		isLoadingMore = true;
		try {
			const nextPage = currentPage + 1;
			const res = await fetch(`/api/notes?page=${nextPage}&limit=12&sort=${sortBy}&order=${sortOrder}`);
			if (res.ok) {
				const data = await res.json();
				notes = [...notes, ...data.items];
				hasMore = data.hasMore;
				currentPage = nextPage;
			}
		} catch (err) {
			console.error('Failed to load more notes:', err);
		} finally {
			isLoadingMore = false;
		}
	}
	
	// Refresh notes list
	async function refreshNotes() {
		try {
			const res = await fetch(`/api/notes?page=1&limit=12&sort=${sortBy}&order=${sortOrder}`);
			if (res.ok) {
				const data = await res.json();
				notes = data.items;
				hasMore = data.hasMore;
				currentPage = 1;
			}
		} catch (err) {
			console.error('Failed to refresh notes:', err);
		}
	}
	
	// Handle sort change
	function handleSortChange(newSortBy: SortBy) {
		if (sortBy === newSortBy) {
			sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
		} else {
			sortBy = newSortBy;
			sortOrder = 'desc';
		}
		refreshNotes();
	}
	
	// Handle note click - expand and enable edit
	function handleNoteClick(noteId: string) {
		if (expandedNoteId === noteId) {
			// Already expanded, go to full editor
			goto(`/editor/${noteId}`);
		} else {
			expandedNoteId = noteId;
		}
	}
	
	// Extract text preview from Editor.js content
	function getExcerpt(note: typeof notes[0], maxLength = 150): string {
		if (note.excerpt) return note.excerpt;
		
		if (note.content?.blocks) {
			const textBlocks = note.content.blocks
				.filter((b: any) => b.type === 'paragraph' || b.type === 'header')
				.map((b: any) => b.data?.text || '')
				.join(' ');
			
			// Strip HTML tags
			const text = textBlocks.replace(/<[^>]*>/g, '');
			return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
		}
		return '';
	}
	
	// Initialize QuickEdit editor on focus
	async function activateEditor() {
		if (quickEditor || isEditorLoading || !browser) return;
		
		isEditorLoading = true;
		
		try {
			const EditorJS = (await import('@editorjs/editorjs')).default;
			const Header = (await import('@editorjs/header')).default;
			const List = (await import('@editorjs/list')).default;
			const Quote = (await import('@editorjs/quote')).default;
			// @ts-expect-error No type declarations available
			const DragDrop = (await import('editorjs-drag-drop')).default;
			
			quickEditor = new EditorJS({
				holder: editorContainer,
				placeholder: i18n.t('editor.placeholder'),
				autofocus: true,
				minHeight: 100,
				tools: {
					header: {
						// @ts-expect-error Editor.js types
						class: Header,
						config: { levels: [2, 3, 4], defaultLevel: 2 },
					},
					list: {
						// @ts-expect-error Editor.js types
						class: List,
						inlineToolbar: true,
					},
					quote: { class: Quote, inlineToolbar: true },
				},
				onChange: () => {
					saveStatus = 'unsaved';
				},
				onReady: () => {
					new DragDrop(quickEditor);
				},
			});
			
			isEditorActive = true;
		} catch (err) {
			console.error('Failed to initialize quick editor:', err);
		} finally {
			isEditorLoading = false;
		}
	}
	
	// Context menu helpers (for future marginalia feature)
	function deleteMarginalia(id: string) {
		marginalia = marginalia.filter(m => m.id !== id);
		closeContextMenu();
		saveStatus = 'unsaved';
	}
	
	function closeContextMenu() {
		showContextMenu = false;
		contextMenuTargetId = null;
	}
	
	function handleMarginaliaDrag(e: MouseEvent) {
		if (!draggingMarginaliaId) return;
		// Drag handling for future marginalia feature
		void e;
	}
	
	function handleMarginaliaDragEnd() {
		if (draggingMarginaliaId) {
			draggingMarginaliaId = null;
			saveStatus = 'unsaved';
		}
	}
	
	// Autosave on blur (offline-first)
	async function handleEditorBlur(e: FocusEvent) {
		// Check if focus moved outside the notes section
		const relatedTarget = e.relatedTarget as HTMLElement | null;
		const notesSection = (e.currentTarget as HTMLElement);
		
		if (relatedTarget && notesSection?.contains(relatedTarget)) {
			return; // Focus still within section
		}
		
		if (saveStatus === 'unsaved' && quickEditor) {
			await saveToCache();
		}
	}
	
	// Save to local cache (offline-first)
	async function saveToCache() {
		if (!quickEditor) return;
		
		saveStatus = 'saving';
		
		try {
			const content = await quickEditor.save();
			const noteData = {
				title: quickNoteTitle || i18n.t('editor.untitled'),
				content,
				tags,
				marginalia,
				noteId: null,
			};
			
			// Save to IndexedDB first
			if (browser) {
				const { saveNoteToCache } = await import('$stores/offline');
				await saveNoteToCache(noteData);
			}
			
			// Sync to server (non-blocking)
			fetch('/api/notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(noteData),
			}).catch(err => console.warn('Server sync pending:', err));
			
			saveStatus = 'saved';
		} catch {
			saveStatus = 'unsaved';
		}
	}
	
	// Expand to full editor
	async function expandToFullEditor() {
		if (saveStatus === 'unsaved' && quickEditor) {
			await saveToCache();
		}
		goto('/editor');
	}
	
	// Keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && showContextMenu) {
			closeContextMenu();
		}
	}
	
	// Cleanup on unmount
	onMount(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (showContextMenu && !(e.target as HTMLElement).closest('.context-menu')) {
				closeContextMenu();
			}
		};
		document.addEventListener('click', handleClickOutside);
		
		// Setup intersection observer for infinite scroll
		let observer: IntersectionObserver | null = null;
		
		const setupObserver = () => {
			if (loadMoreTrigger) {
				observer = new IntersectionObserver(
					(entries) => {
						if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
							loadMoreNotes();
						}
					},
					{ threshold: 0.1 }
				);
				observer.observe(loadMoreTrigger);
			}
		};
		
		// Delay observer setup to ensure element is mounted
		setTimeout(setupObserver, 100);
		
		return () => {
			quickEditor?.destroy();
			document.removeEventListener('click', handleClickOutside);
			observer?.disconnect();
		};
	});
</script>

<svelte:window 
	onkeydown={handleKeydown}
	onmousemove={handleMarginaliaDrag}
	onmouseup={handleMarginaliaDragEnd}
/>

<div class="dashboard">
	<!-- Header with Welcome + Stats -->
	<header class="dashboard-header">
		{#if userData}
			<h1 class="welcome-heading">{welcomeMessage}</h1>
		{/if}
		<div class="header-stats">
			<span class="header-stat">{stats.notes} {i18n.t('dashboard.stats.notes')}</span>
			<span class="header-stat-divider">·</span>
			<span class="header-stat">{stats.documents} {i18n.t('dashboard.stats.documents')}</span>
		</div>
	</header>
	
	<!-- Notes List with View Options -->
	<section class="notes-section" onblur={handleEditorBlur}>
		<div class="notes-header">
			<h2 class="section-title">{i18n.t('dashboard.recentNotes')}</h2>
			
			<div class="notes-controls">
				<!-- Sort dropdown -->
				<div class="sort-controls">
					<button 
						type="button" 
						class="sort-btn" 
						class:active={sortBy === 'updated'}
						onclick={() => handleSortChange('updated')}
					>
						{i18n.t('sort.updated')}
						{#if sortBy === 'updated'}
							<span class="sort-arrow">{sortOrder === 'desc' ? '↓' : '↑'}</span>
						{/if}
					</button>
					<button 
						type="button" 
						class="sort-btn" 
						class:active={sortBy === 'created'}
						onclick={() => handleSortChange('created')}
					>
						{i18n.t('sort.created')}
						{#if sortBy === 'created'}
							<span class="sort-arrow">{sortOrder === 'desc' ? '↓' : '↑'}</span>
						{/if}
					</button>
					<button 
						type="button" 
						class="sort-btn" 
						class:active={sortBy === 'title'}
						onclick={() => handleSortChange('title')}
					>
						{i18n.t('sort.title')}
						{#if sortBy === 'title'}
							<span class="sort-arrow">{sortOrder === 'desc' ? '↓' : '↑'}</span>
						{/if}
					</button>
				</div>
				
				<!-- View mode switcher -->
				<div class="view-controls">
					<button 
						type="button" 
						class="view-btn" 
						class:active={viewMode === 'list'}
						onclick={() => viewMode = 'list'}
						title={i18n.t('view.list')}
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
							<line x1="3" y1="6" x2="21" y2="6" />
							<line x1="3" y1="12" x2="21" y2="12" />
							<line x1="3" y1="18" x2="21" y2="18" />
						</svg>
					</button>
					<button 
						type="button" 
						class="view-btn" 
						class:active={viewMode === 'grid-small'}
						onclick={() => viewMode = 'grid-small'}
						title={i18n.t('view.gridSmall')}
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
							<rect x="3" y="3" width="7" height="7" rx="1" />
							<rect x="14" y="3" width="7" height="7" rx="1" />
							<rect x="3" y="14" width="7" height="7" rx="1" />
							<rect x="14" y="14" width="7" height="7" rx="1" />
						</svg>
					</button>
					<button 
						type="button" 
						class="view-btn" 
						class:active={viewMode === 'grid-large'}
						onclick={() => viewMode = 'grid-large'}
						title={i18n.t('view.gridLarge')}
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
							<rect x="3" y="3" width="18" height="8" rx="1" />
							<rect x="3" y="13" width="18" height="8" rx="1" />
						</svg>
					</button>
					<button 
						type="button" 
						class="view-btn" 
						class:active={viewMode === 'expanded'}
						onclick={() => viewMode = 'expanded'}
						title={i18n.t('view.expanded')}
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
							<rect x="3" y="3" width="18" height="18" rx="2" />
							<line x1="7" y1="8" x2="17" y2="8" />
							<line x1="7" y1="12" x2="17" y2="12" />
							<line x1="7" y1="16" x2="13" y2="16" />
						</svg>
					</button>
				</div>
			</div>
		</div>
		
		<!-- Notes grid/list - QuickEdit is always first -->
		<div class="notes-container" class:list-view={viewMode === 'list'} class:grid-small={viewMode === 'grid-small'} class:grid-large={viewMode === 'grid-large'} class:expanded-view={viewMode === 'expanded'} class:has-expanded-editor={isEditorActive && (viewMode === 'grid-small' || viewMode === 'grid-large')}>
			
			<!-- First card is always the new note editor -->
			<div 
				class="note-card new-note-card"
				class:active={isEditorActive}
				class:expanded={isEditorActive && (viewMode === 'grid-small' || viewMode === 'grid-large')}
			>
				<div 
					class="quick-edit-editor"
					bind:this={editorContainer}
					onfocus={activateEditor}
					onclick={activateEditor}
					onkeydown={(e) => e.key === 'Enter' && !isEditorActive && activateEditor()}
					role="textbox"
					tabindex="0"
				>
					{#if !isEditorActive && !isEditorLoading}
						<span class="quick-edit-placeholder">{i18n.t('editor.placeholder')}</span>
					{/if}
					{#if isEditorLoading}
						<span class="quick-edit-loading">...</span>
					{/if}
				</div>
				
				{#if isEditorActive}
					<div class="quick-edit-footer">
						<span class="save-indicator" class:saved={saveStatus === 'saved'} class:saving={saveStatus === 'saving'}>
							{#if saveStatus === 'saved'}
								{i18n.t('editor.saved')}
							{:else if saveStatus === 'saving'}
								{i18n.t('editor.saving')}
							{:else if saveStatus === 'unsaved'}
								●
							{/if}
						</span>
						<button 
							type="button"
							class="btn btn-ghost btn-sm"
							onclick={expandToFullEditor}
						>
							{i18n.t('editor.fullscreen')}
						</button>
					</div>
				{/if}
			</div>
			
			<!-- Existing notes -->
			{#each sortedNotes() as note (note.id)}
					<button
						type="button"
						class="note-card"
						class:expanded={expandedNoteId === note.id || viewMode === 'expanded'}
						onclick={() => handleNoteClick(note.id)}
					>
						<div class="note-card-header">
							<h3 class="note-title">{note.title || i18n.t('editor.untitled')}</h3>
							{#if note.tags?.length > 0}
								<div class="note-tags">
									{#each note.tags.slice(0, 3) as tag}
										<span class="note-tag">{tag}</span>
									{/each}
									{#if note.tags.length > 3}
										<span class="note-tag-more">+{note.tags.length - 3}</span>
									{/if}
								</div>
							{/if}
						</div>
						
						{#if viewMode !== 'list' || expandedNoteId === note.id}
							<p class="note-excerpt">{getExcerpt(note, viewMode === 'expanded' || expandedNoteId === note.id ? 500 : 150)}</p>
						{/if}
						
						<div class="note-card-footer">
							<span class="note-time">{formatTimeAgo(note.updated_at)}</span>
							{#if note.word_count}
								<span class="note-words">{note.word_count} {i18n.t('editor.words')}</span>
							{/if}
						</div>
					</button>
				{/each}
		</div>
		
		<!-- Load more trigger -->
		{#if hasMore}
			<div bind:this={loadMoreTrigger} class="load-more-trigger">
				{#if isLoadingMore}
					<span class="loading-spinner"></span>
				{/if}
			</div>
		{/if}
	</section>
	
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
	/* Welcome heading */
	.welcome-heading {
		font-family: var(--font-human);
		font-size: var(--font-size-2xl);
		font-weight: 500;
		color: var(--color-text);
		margin-bottom: var(--space-6);
	}
	
	/* QuickEdit Editor inside new note card */
	.quick-edit-editor {
		flex: 1;
		min-height: 60px;
		font-family: var(--font-human);
		font-size: var(--font-size-base);
		color: var(--color-text);
		cursor: text;
		outline: none;
	}
	
	.quick-edit-placeholder,
	.quick-edit-loading {
		color: var(--color-text-muted);
		font-style: italic;
	}
	
	.quick-edit-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border-subtle);
		margin-top: var(--space-3);
	}
	
	.save-indicator {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	
	.save-indicator.saved { color: var(--color-success); }
	.save-indicator.saving { color: var(--color-warning); }
	
	/* Editor.js overrides */
	.quick-edit-editor :global(.codex-editor__redactor) {
		padding-bottom: var(--space-2) !important;
	}
	
	.quick-edit-editor :global(.ce-block__content) {
		max-width: 100%;
	}
	
	/* Context menu */
	.context-menu {
		position: fixed;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: var(--z-dropdown);
		min-width: 100px;
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
	
	/* Notes Section */
	.notes-section {
		margin-top: var(--space-6);
	}
	
	.notes-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}
	
	.notes-controls {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}
	
	.sort-controls {
		display: flex;
		gap: var(--space-1);
	}
	
	.sort-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-2);
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.sort-btn:hover {
		color: var(--color-text);
		background: var(--color-bg-hover);
	}
	
	.sort-btn.active {
		color: var(--color-active);
		border-color: var(--color-active);
	}
	
	.sort-arrow {
		font-size: 10px;
	}
	
	.view-controls {
		display: flex;
		gap: var(--space-1);
		padding: var(--space-1);
		background: var(--color-bg-sunken);
		border-radius: var(--radius-md);
	}
	
	.view-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-1);
		color: var(--color-text-secondary);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.view-btn:hover {
		color: var(--color-text);
		background: var(--color-bg-hover);
	}
	
	.view-btn.active {
		color: var(--color-active);
		background: var(--color-bg-elevated);
	}
	
	/* Notes container - different layouts */
	.notes-container {
		display: grid;
		gap: var(--space-3);
	}
	
	.notes-container.list-view {
		grid-template-columns: 1fr;
	}
	
	.notes-container.grid-small {
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	}
	
	.notes-container.grid-large {
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	}
	
	.notes-container.expanded-view {
		grid-template-columns: 1fr;
	}
	
	/* Note card */
	.note-card {
		display: flex;
		flex-direction: column;
		padding: var(--space-3);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast);
		text-decoration: none;
		color: inherit;
		width: 100%;
	}
	
	.note-card:hover {
		border-color: var(--color-active);
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.note-card.expanded {
		background: var(--color-bg);
		border-color: var(--color-active);
	}
	
	/* List view - all same height */
	.list-view .note-card {
		flex-direction: row;
		align-items: center;
		gap: var(--space-4);
		min-height: 48px;
	}
	
	.list-view .note-card-header {
		flex: 1;
		min-width: 0;
	}
	
	.list-view .note-card-footer {
		flex-shrink: 0;
	}
	
	/* Grid small - compact cards */
	.grid-small .note-card {
		min-height: 120px;
	}
	
	/* Grid large - taller cards with more preview */
	.grid-large .note-card {
		min-height: 200px;
	}
	
	/* Expanded view - full content */
	.expanded-view .note-card {
		min-height: auto;
	}
	
	.note-card-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		margin-bottom: var(--space-2);
	}
	
	.note-title {
		font-family: var(--font-human);
		font-size: var(--font-size-base);
		font-weight: 500;
		color: var(--color-text);
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.list-view .note-title {
		white-space: nowrap;
	}
	
	.note-tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}
	
	.note-tag {
		padding: 0 var(--space-1);
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		background: var(--color-bg-sunken);
		border-radius: var(--radius-sm);
	}
	
	.note-tag-more {
		padding: 0 var(--space-1);
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	
	.note-excerpt {
		flex: 1;
		font-family: var(--font-human);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
		color: var(--color-text-secondary);
		margin: 0;
		overflow: hidden;
	}
	
	.grid-small .note-excerpt {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
	}
	
	.grid-large .note-excerpt {
		display: -webkit-box;
		-webkit-line-clamp: 6;
		line-clamp: 6;
		-webkit-box-orient: vertical;
	}
	
	.note-card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		margin-top: auto;
		padding-top: var(--space-2);
	}
	
	.note-time,
	.note-words {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	
	/* Load more trigger */
	.load-more-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		min-height: 60px;
	}
	
	.loading-spinner {
		width: 24px;
		height: 24px;
		border: 2px solid var(--color-border);
		border-top-color: var(--color-active);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.notes-header {
			flex-direction: column;
			align-items: stretch;
		}
		
		.notes-controls {
			justify-content: space-between;
		}
		
		.notes-container.grid-small,
		.notes-container.grid-large {
			grid-template-columns: 1fr;
		}
	}
</style>
