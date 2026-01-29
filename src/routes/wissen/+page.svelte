<!--
  Artellico - Wissen (Knowledge) Page
  
  Full notes list with search, filtering, sorting and view modes.
  Clicking a note opens it in the inline editor (expanded view).
-->

<script lang="ts">
	import { goto } from '$app/navigation';
	import { createI18n } from '$stores/i18n.svelte';
	import EditorCore from '$lib/components/editor/EditorCore.svelte';
	
	let { data } = $props();
	
	const i18n = createI18n();
	
	// View modes
	type ViewMode = 'list' | 'grid-small' | 'grid-large';
	let viewMode = $state<ViewMode>('grid-small');
	
	// Sorting - from data (read-only, changes via URL)
	const currentSortBy = $derived(data.sort.by);
	const currentSortOrder = $derived(data.sort.order);
	
	// Expanded note editor
	let expandedNoteId = $state<string | null>(null);
	let expandedNoteData = $state<any>(null);
	
	// Format time ago
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
	
	// Extract text preview from Editor.js content
	function getExcerpt(content: any, maxLength = 150): string {
		if (!content?.blocks) return '';
		
		const textBlocks = content.blocks
			.filter((b: any) => b.type === 'paragraph' || b.type === 'header')
			.map((b: any) => b.data?.text || '')
			.join(' ');
		
		// Strip HTML tags
		const text = textBlocks.replace(/<[^>]*>/g, '');
		return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
	}
	
	// Handle note click - expand inline
	function handleNoteClick(note: any) {
		if (expandedNoteId === note.id) {
			// Already expanded, go to full editor
			goto(`/editor/${note.id}`);
		} else {
			expandedNoteId = note.id;
			expandedNoteData = note;
		}
	}
	
	// Close expanded editor
	async function closeExpandedEditor() {
		expandedNoteId = null;
		expandedNoteData = null;
	}
	
	// Handle save from inline editor
	async function handleSave(noteData: { title: string; content: any; tags: string[]; marginalia: any[] }) {
		if (!expandedNoteId) return;
		
		try {
			await fetch(`/api/notes/${expandedNoteId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(noteData),
			});
		} catch (err) {
			console.error('Save failed:', err);
		}
	}
	
	// Handle expand to fullscreen
	function handleExpand() {
		if (expandedNoteId) {
			goto(`/editor/${expandedNoteId}`);
		}
	}
	
	// Handle sort change
	function handleSortChange(newSortBy: string) {
		let newOrder = 'desc';
		if (currentSortBy === newSortBy) {
			newOrder = currentSortOrder === 'desc' ? 'asc' : 'desc';
		}
		goto(`/wissen?sort=${newSortBy}&order=${newOrder}`);
	}
</script>

<svelte:head>
	<title>{i18n.t('nav.knowledge')} - Artellico</title>
</svelte:head>

<div class="wissen-page">
	<!-- Header -->
	<header class="wissen-header">
		<h1>{i18n.t('nav.knowledge')}</h1>
		
		<div class="header-actions">
			<!-- View Mode Toggle -->
			<div class="view-toggle" role="radiogroup" aria-label="View mode">
				<button
					type="button"
					class="view-btn"
					class:active={viewMode === 'list'}
					onclick={() => viewMode = 'list'}
					aria-pressed={viewMode === 'list'}
					title="Liste"
				>
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="3" y1="6" x2="21" y2="6"/>
						<line x1="3" y1="12" x2="21" y2="12"/>
						<line x1="3" y1="18" x2="21" y2="18"/>
					</svg>
				</button>
				<button
					type="button"
					class="view-btn"
					class:active={viewMode === 'grid-small'}
					onclick={() => viewMode = 'grid-small'}
					aria-pressed={viewMode === 'grid-small'}
					title="Kleine Karten"
				>
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="3" width="7" height="7"/>
						<rect x="14" y="3" width="7" height="7"/>
						<rect x="3" y="14" width="7" height="7"/>
						<rect x="14" y="14" width="7" height="7"/>
					</svg>
				</button>
				<button
					type="button"
					class="view-btn"
					class:active={viewMode === 'grid-large'}
					onclick={() => viewMode = 'grid-large'}
					aria-pressed={viewMode === 'grid-large'}
					title="Große Karten"
				>
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="3" width="8" height="8"/>
						<rect x="13" y="3" width="8" height="8"/>
						<rect x="3" y="13" width="8" height="8"/>
						<rect x="13" y="13" width="8" height="8"/>
					</svg>
				</button>
			</div>
			
			<!-- Sort Dropdown -->
			<select
				class="sort-select"
				value={currentSortBy}
				onchange={(e) => handleSortChange(e.currentTarget.value)}
			>
				<option value="updated_at">{i18n.t('sort.updated')}</option>
				<option value="created_at">{i18n.t('sort.created')}</option>
				<option value="title">{i18n.t('sort.title')}</option>
				<option value="word_count">{i18n.t('sort.wordCount')}</option>
			</select>
			
			<!-- New Note Button -->
			<a href="/editor/new" class="btn btn-primary">
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="12" y1="5" x2="12" y2="19"/>
					<line x1="5" y1="12" x2="19" y2="12"/>
				</svg>
				{i18n.t('action.newNote')}
			</a>
		</div>
	</header>
	
	<!-- Notes Grid/List -->
	<div class="notes-container" class:list={viewMode === 'list'} class:grid-small={viewMode === 'grid-small'} class:grid-large={viewMode === 'grid-large'}>
		{#each data.notes as note (note.id)}
			{#if expandedNoteId === note.id}
				<!-- Expanded inline editor -->
				<div class="note-expanded">
					<EditorCore
						noteId={note.id}
						initialTitle={expandedNoteData?.title || note.title}
						initialContent={expandedNoteData?.content || note.content}
						initialTags={expandedNoteData?.tags || note.tags || []}
						initialMarginalia={[]}
						mode="inline"
						onSave={handleSave}
						onExpand={handleExpand}
						onClose={closeExpandedEditor}
					/>
				</div>
			{:else}
				<!-- Note card -->
				<button
					type="button"
					class="note-card"
					onclick={() => handleNoteClick(note)}
				>
					<h3 class="note-title">{note.title || i18n.t('editor.untitled')}</h3>
					<p class="note-excerpt">{getExcerpt(note.content)}</p>
					<div class="note-meta">
						<span class="note-time">{formatTimeAgo(note.updated_at)}</span>
						{#if note.word_count}
							<span class="note-words">{note.word_count} {i18n.t('stats.words')}</span>
						{/if}
					</div>
					{#if note.tags?.length}
						<div class="note-tags">
							{#each note.tags.slice(0, 3) as tag}
								<span class="tag-chip">{tag}</span>
							{/each}
							{#if note.tags.length > 3}
								<span class="tag-more">+{note.tags.length - 3}</span>
							{/if}
						</div>
					{/if}
				</button>
			{/if}
		{/each}
	</div>
	
	<!-- Pagination -->
	{#if data.pagination.totalPages > 1}
		<nav class="pagination" aria-label="Pagination">
			{#if data.pagination.page > 1}
				<a href="/wissen?page={data.pagination.page - 1}&sort={currentSortBy}&order={currentSortOrder}" class="pagination-btn">
					← {i18n.t('pagination.prev')}
				</a>
			{/if}
			
			<span class="pagination-info">
				{i18n.t('pagination.page', { current: data.pagination.page, total: data.pagination.totalPages })}
			</span>
			
			{#if data.pagination.hasMore}
				<a href="/wissen?page={data.pagination.page + 1}&sort={currentSortBy}&order={currentSortOrder}" class="pagination-btn">
					{i18n.t('pagination.next')} →
				</a>
			{/if}
		</nav>
	{/if}
	
	<!-- Empty State -->
	{#if data.notes.length === 0}
		<div class="empty-state">
			<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
				<polyline points="14 2 14 8 20 8"/>
				<line x1="12" y1="18" x2="12" y2="12"/>
				<line x1="9" y1="15" x2="15" y2="15"/>
			</svg>
			<p>{i18n.t('notes.empty')}</p>
			<a href="/editor/new" class="btn btn-primary">{i18n.t('action.createFirst')}</a>
		</div>
	{/if}
</div>

<style>
	.wissen-page {
		max-width: 1400px;
		margin: 0 auto;
		padding: var(--space-6);
	}
	
	.wissen-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-6);
		flex-wrap: wrap;
		gap: var(--space-4);
	}
	
	.wissen-header h1 {
		font-family: var(--font-human);
		font-size: var(--font-size-2xl);
		font-weight: 600;
		margin: 0;
	}
	
	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	
	.view-toggle {
		display: flex;
		background: var(--color-bg-sunken);
		border-radius: var(--radius-md);
		padding: 2px;
	}
	
	.view-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: transparent;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}
	
	.view-btn:hover {
		color: var(--color-text);
	}
	
	.view-btn.active {
		background: var(--color-bg);
		color: var(--color-text);
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
	}
	
	.sort-select {
		padding: var(--space-2) var(--space-3);
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		color: var(--color-text);
		background: var(--color-bg-sunken);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		cursor: pointer;
	}
	
	/* Notes Grid */
	.notes-container {
		display: grid;
		gap: var(--space-4);
	}
	
	.notes-container.list {
		grid-template-columns: 1fr;
	}
	
	.notes-container.grid-small {
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	}
	
	.notes-container.grid-large {
		grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
	}
	
	.note-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: var(--space-4);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-md);
		cursor: pointer;
		text-align: left;
		transition: all var(--transition-fast);
	}
	
	.note-card:hover {
		border-color: var(--color-border);
		box-shadow: 0 2px 8px rgba(0,0,0,0.05);
	}
	
	.note-title {
		font-family: var(--font-human);
		font-size: var(--font-size-base);
		font-weight: 500;
		margin: 0 0 var(--space-2);
		color: var(--color-text);
	}
	
	.note-excerpt {
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		margin: 0 0 var(--space-3);
		line-height: var(--line-height-relaxed);
		flex: 1;
	}
	
	.note-meta {
		display: flex;
		gap: var(--space-3);
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin-bottom: var(--space-2);
	}
	
	.note-tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}
	
	.tag-chip {
		padding: 2px var(--space-2);
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		background: var(--color-bg-sunken);
		border-radius: var(--radius-full);
		color: var(--color-text-secondary);
	}
	
	.tag-more {
		padding: 2px var(--space-2);
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	
	.note-expanded {
		grid-column: 1 / -1;
	}
	
	/* List view adjustments */
	.notes-container.list .note-card {
		flex-direction: row;
		align-items: center;
		gap: var(--space-4);
	}
	
	.notes-container.list .note-title {
		min-width: 200px;
		margin: 0;
	}
	
	.notes-container.list .note-excerpt {
		flex: 1;
		margin: 0;
	}
	
	.notes-container.list .note-meta {
		margin: 0;
	}
	
	.notes-container.list .note-tags {
		display: none;
	}
	
	/* Pagination */
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--space-4);
		margin-top: var(--space-8);
		padding: var(--space-4) 0;
	}
	
	.pagination-btn {
		padding: var(--space-2) var(--space-4);
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		color: var(--color-text);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: all var(--transition-fast);
	}
	
	.pagination-btn:hover {
		background: var(--color-bg-hover);
	}
	
	.pagination-info {
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}
	
	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-16) var(--space-4);
		text-align: center;
		color: var(--color-text-muted);
	}
	
	.empty-state svg {
		margin-bottom: var(--space-4);
		opacity: 0.5;
	}
	
	.empty-state p {
		font-family: var(--font-machine);
		font-size: var(--font-size-base);
		margin-bottom: var(--space-4);
	}
</style>
