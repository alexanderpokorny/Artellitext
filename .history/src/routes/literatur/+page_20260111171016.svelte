<!--
  Artellico - Literature (Document Library) Page
  
  Document management with grid/list views and reading mode.
-->

<script lang="ts">
	import { createI18n } from '$stores/i18n.svelte';
	import { createReadingMode } from '$stores/theme.svelte';
	import type { PageData } from './$types';
	import type { ViewMode } from '$types';
	
	const { } = $props<{ data: PageData }>();
	
	const i18n = createI18n();
	const readingMode = createReadingMode();
	
	// View state
	let viewMode = $state<ViewMode>({
		layout: 'grid',
		sortBy: 'date',
		sortOrder: 'desc',
	});
	
	// Demo documents
	const documents = [
		{ id: '1', title: 'Kritik der reinen Vernunft', author: 'Immanuel Kant', type: 'pdf', thumbnail: null, syncStatus: 'synced' },
		{ id: '2', title: 'Sein und Zeit', author: 'Martin Heidegger', type: 'pdf', thumbnail: null, syncStatus: 'synced' },
		{ id: '3', title: 'Phänomenologie des Geistes', author: 'G.W.F. Hegel', type: 'epub', thumbnail: null, syncStatus: 'offline' },
		{ id: '4', title: 'Tractatus Logico-Philosophicus', author: 'Ludwig Wittgenstein', type: 'pdf', thumbnail: null, syncStatus: 'synced' },
		{ id: '5', title: 'Die Welt als Wille und Vorstellung', author: 'Arthur Schopenhauer', type: 'pdf', thumbnail: null, syncStatus: 'pending' },
		{ id: '6', title: 'Also sprach Zarathustra', author: 'Friedrich Nietzsche', type: 'epub', thumbnail: null, syncStatus: 'synced' },
	];
	
	function getTypeIcon(type: string): string {
		const icons: Record<string, string> = {
			pdf: '📄',
			epub: '📚',
			docx: '📝',
			xlsx: '📊',
		};
		return icons[type] || '📎';
	}
	
	function getSyncColor(status: string): string {
		const colors: Record<string, string> = {
			synced: 'var(--color-sync-ok)',
			pending: 'var(--color-sync-pending)',
			offline: 'var(--color-sync-offline)',
		};
		return colors[status] || 'var(--color-text-muted)';
	}
</script>

<div class="literature-page">
	<!-- Page header -->
	<header class="page-header">
		<div class="header-left">
			<h1 class="page-title">{i18n.t('literature.title')}</h1>
			<span class="doc-count">{documents.length} {i18n.t('status.documents', { count: documents.length })}</span>
		</div>
		
		<div class="header-actions">
			<!-- View toggles -->
			<div class="view-toggles">
				<button
					type="button"
					class="view-btn"
					class:active={viewMode.layout === 'grid'}
					onclick={() => viewMode.layout = 'grid'}
					aria-label={i18n.t('literature.view.grid')}
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="3" width="7" height="7" />
						<rect x="14" y="3" width="7" height="7" />
						<rect x="3" y="14" width="7" height="7" />
						<rect x="14" y="14" width="7" height="7" />
					</svg>
				</button>
				<button
					type="button"
					class="view-btn"
					class:active={viewMode.layout === 'list'}
					onclick={() => viewMode.layout = 'list'}
					aria-label={i18n.t('literature.view.list')}
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="3" y1="6" x2="21" y2="6" />
						<line x1="3" y1="12" x2="21" y2="12" />
						<line x1="3" y1="18" x2="21" y2="18" />
					</svg>
				</button>
			</div>
			
			<!-- Sort dropdown -->
			<select
				class="sort-select"
				bind:value={viewMode.sortBy}
				aria-label={i18n.t('literature.sort')}
			>
				<option value="date">{i18n.t('literature.sortBy.date')}</option>
				<option value="title">{i18n.t('literature.sortBy.title')}</option>
				<option value="type">{i18n.t('literature.sortBy.type')}</option>
			</select>
			
			<button
				type="button"
				class="sort-order"
				onclick={() => viewMode.sortOrder = viewMode.sortOrder === 'asc' ? 'desc' : 'asc'}
				aria-label={viewMode.sortOrder === 'asc' ? 'Descending' : 'Ascending'}
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class:flipped={viewMode.sortOrder === 'asc'}>
					<polyline points="6 9 12 15 18 9" />
				</svg>
			</button>
			
			<!-- Reading mode toggle -->
			<button
				type="button"
				class="btn btn-ghost"
				onclick={() => readingMode.toggle()}
			>
				{i18n.t('literature.readingMode')}
			</button>
			
			<!-- Upload button -->
			<button type="button" class="btn btn-primary">
				{i18n.t('literature.upload')}
			</button>
		</div>
	</header>
	
	<!-- Document grid/list -->
	{#if documents.length === 0}
		<div class="empty-state">
			<span class="empty-icon">📚</span>
			<p class="empty-text">{i18n.t('literature.noDocuments')}</p>
			<button type="button" class="btn btn-primary">
				{i18n.t('literature.upload')}
			</button>
		</div>
	{:else}
		<div class="documents" class:grid={viewMode.layout === 'grid'} class:list={viewMode.layout === 'list'}>
			{#each documents as doc}
				<a href="/literatur/{doc.id}" class="document-card">
					<!-- Thumbnail -->
					<div class="doc-thumbnail">
						{#if doc.thumbnail}
							<img src={doc.thumbnail} alt="" />
						{:else}
							<span class="thumbnail-placeholder">{getTypeIcon(doc.type)}</span>
						{/if}
						
						<!-- Sync status indicator -->
						<span
							class="sync-dot"
							style="background-color: {getSyncColor(doc.syncStatus)}"
							title={doc.syncStatus}
						></span>
					</div>
					
					<!-- Doc info -->
					<div class="doc-info">
						<h3 class="doc-title">{doc.title}</h3>
						<p class="doc-author">{doc.author}</p>
						
						<!-- Type badge -->
						<span class="doc-type">{doc.type.toUpperCase()}</span>
					</div>
					
					<!-- Hover menu -->
					<div class="doc-menu">
						<button type="button" class="menu-btn" aria-label="Dokumentmenü öffnen" onclick={(e) => { e.preventDefault(); }}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="5" r="1" />
								<circle cx="12" cy="12" r="1" />
								<circle cx="12" cy="19" r="1" />
							</svg>
						</button>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.literature-page {
		max-width: var(--content-wide-max-width);
		margin: 0 auto;
	}
	
	/* Header */
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		margin-bottom: var(--space-6);
		flex-wrap: wrap;
	}
	
	.header-left {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
	}
	
	.page-title {
		font-family: var(--font-human);
		font-size: var(--font-size-2xl);
		font-weight: 500;
		color: var(--color-text);
	}
	
	.doc-count {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	
	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	
	/* View toggles */
	.view-toggles {
		display: flex;
		gap: var(--space-1);
		padding: var(--space-1);
		background: var(--color-bg-sunken);
		border-radius: var(--radius-sm);
	}
	
	.view-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.view-btn:hover {
		color: var(--color-text);
	}
	
	.view-btn.active {
		background: var(--color-bg-elevated);
		color: var(--color-text);
	}
	
	.view-btn svg {
		width: 18px;
		height: 18px;
	}
	
	/* Sort */
	.sort-select {
		padding: var(--space-2) var(--space-3);
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		background: var(--color-bg-sunken);
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	
	.sort-order {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		background: var(--color-bg-sunken);
		border: none;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.sort-order:hover {
		color: var(--color-text);
	}
	
	.sort-order svg {
		width: 18px;
		height: 18px;
		transition: transform var(--transition-fast);
	}
	
	.sort-order svg.flipped {
		transform: rotate(180deg);
	}
	
	/* Documents grid */
	.documents {
		display: grid;
		gap: var(--space-4);
	}
	
	.documents.grid {
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
	}
	
	.documents.list {
		grid-template-columns: 1fr;
	}
	
	/* Document card */
	.document-card {
		position: relative;
		display: flex;
		flex-direction: column;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
		text-decoration: none;
		transition: all var(--transition-fast);
	}
	
	.document-card:hover {
		border-color: var(--color-border-strong);
		transform: translateY(-2px);
	}
	
	.documents.list .document-card {
		flex-direction: row;
		align-items: center;
	}
	
	/* Thumbnail */
	.doc-thumbnail {
		position: relative;
		aspect-ratio: 3/4;
		background: var(--color-bg-sunken);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.documents.list .doc-thumbnail {
		width: 60px;
		height: 80px;
		flex-shrink: 0;
	}
	
	.doc-thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.thumbnail-placeholder {
		font-size: 2rem;
	}
	
	.sync-dot {
		position: absolute;
		top: var(--space-2);
		right: var(--space-2);
		width: 8px;
		height: 8px;
		border-radius: var(--radius-full);
	}
	
	/* Doc info */
	.doc-info {
		padding: var(--space-3);
		flex: 1;
		min-width: 0;
	}
	
	.doc-title {
		font-family: var(--font-human);
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text);
		line-height: var(--line-height-tight);
		margin-bottom: var(--space-1);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.doc-author {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin-bottom: var(--space-2);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.doc-type {
		font-family: var(--font-machine);
		font-size: 10px;
		font-weight: 600;
		letter-spacing: var(--tracking-wider);
		color: var(--color-text-muted);
		padding: var(--space-1) var(--space-2);
		background: var(--color-bg-sunken);
		border-radius: var(--radius-sm);
	}
	
	/* Hover menu */
	.doc-menu {
		position: absolute;
		bottom: var(--space-2);
		right: var(--space-2);
		opacity: 0;
		transition: opacity var(--transition-fast);
	}
	
	.document-card:hover .doc-menu {
		opacity: 1;
	}
	
	.menu-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		cursor: pointer;
	}
	
	.menu-btn:hover {
		color: var(--color-text);
		border-color: var(--color-text);
	}
	
	.menu-btn svg {
		width: 16px;
		height: 16px;
	}
	
	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-16);
		text-align: center;
	}
	
	.empty-icon {
		font-size: 4rem;
		margin-bottom: var(--space-4);
	}
	
	.empty-text {
		font-family: var(--font-human);
		font-size: var(--font-size-lg);
		color: var(--color-text-muted);
		margin-bottom: var(--space-6);
	}
	
	@media (max-width: 767px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start;
		}
		
		.header-actions {
			width: 100%;
			flex-wrap: wrap;
		}
		
		.documents.grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
