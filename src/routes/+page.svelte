<!--
  Artellico - Dashboard (Home Page)
  
  Landing page showing recent notes, quick actions, and statistics.
  Includes inline editor that activates on focus.
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { createI18n } from '$stores/i18n.svelte';
	
	let { data }: { data: PageData } = $props();
	// Derived user data for future personalization
	const userData = $derived(data.user);
	
	const i18n = createI18n();
	
	// Inline editor state
	let quickNoteContainer: HTMLElement;
	let quickEditor: any = $state(null);
	let isEditorActive = $state(false);
	let isEditorLoading = $state(false);
	let quickNoteTitle = $state('');
	let isFullscreen = $state(false);
	
	// Demo data for initial display (will be replaced with real data from server)
	const stats = $derived({
		notes: 42,
		documents: 18,
		storage: '2.4 GB',
	});
	
	// Welcome message based on user
	const welcomeMessage = $derived(
		userData?.displayName 
			? i18n.t('dashboard.welcome', { name: userData.displayName })
			: i18n.t('dashboard.welcome', { name: userData?.username || 'User' })
	);
	
	const recentNotes = [
		{ id: '1', title: 'Einführung in die Epistemologie', excerpt: 'Die Erkenntnistheorie befasst sich mit den grundlegenden Fragen...', updatedAt: new Date(Date.now() - 3600000) },
		{ id: '2', title: 'Kant und die synthetischen Urteile a priori', excerpt: 'Kants kritische Philosophie unterscheidet zwischen analytischen...', updatedAt: new Date(Date.now() - 86400000) },
		{ id: '3', title: 'Notizen zur Phänomenologie', excerpt: 'Husserls phänomenologische Methode der Epoché...', updatedAt: new Date(Date.now() - 172800000) },
	];
	
	function formatTimeAgo(date: Date): string {
		const diff = Date.now() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);
		
		if (minutes < 60) return i18n.t('time.minutesAgo', { minutes });
		if (hours < 24) return i18n.t('time.hoursAgo', { hours });
		return i18n.t('time.daysAgo', { days });
	}
	
	// Initialize Editor.js on focus
	async function activateEditor() {
		if (quickEditor || isEditorLoading || !browser) return;
		
		isEditorLoading = true;
		
		try {
			const EditorJS = (await import('@editorjs/editorjs')).default;
			const Header = (await import('@editorjs/header')).default;
			const List = (await import('@editorjs/list')).default;
			const Quote = (await import('@editorjs/quote')).default;
			
			quickEditor = new EditorJS({
				holder: quickNoteContainer,
				placeholder: i18n.t('editor.placeholder'),
				autofocus: true,
				minHeight: 100,
				tools: {
					header: {
						// @ts-expect-error Editor.js types
						class: Header,
						config: {
							levels: [2, 3, 4],
							defaultLevel: 2,
						},
					},
					list: {
						// @ts-expect-error Editor.js types
						class: List,
						inlineToolbar: true,
					},
					quote: {
						class: Quote,
						inlineToolbar: true,
					},
				},
			});
			
			isEditorActive = true;
		} catch (err) {
			console.error('Failed to initialize quick editor:', err);
		} finally {
			isEditorLoading = false;
		}
	}
	
	// Save quick note and navigate to full editor
	async function saveAndExpand() {
		if (!quickEditor) return;
		
		try {
			const content = await quickEditor.save();
			
			// Save to server
			const response = await fetch('/api/notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: quickNoteTitle || i18n.t('editor.untitled'),
					content,
					tags: [],
				}),
			});
			
			if (response.ok) {
				const { id } = await response.json();
				goto(`/editor/${id}`);
			} else {
				// Fallback: navigate to new editor with content in memory
				goto('/editor');
			}
		} catch (err) {
			console.error('Failed to save quick note:', err);
			goto('/editor');
		}
	}
	
	// Toggle fullscreen mode
	function toggleFullscreen() {
		isFullscreen = !isFullscreen;
	}
	
	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (isFullscreen && event.key === 'Escape') {
			isFullscreen = false;
		}
	}
	
	// Cleanup on unmount
	onMount(() => {
		return () => {
			quickEditor?.destroy();
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="dashboard" class:has-fullscreen-editor={isFullscreen}>
	<!-- Welcome Message -->
	{#if userData && !isFullscreen}
		<h1 class="welcome-heading">{welcomeMessage}</h1>
	{/if}
	
	<!-- Quick Note Editor -->
	<section class="quick-note-section" class:active={isEditorActive} class:fullscreen={isFullscreen}>
		<div class="quick-note-header">
			<input
				type="text"
				class="quick-note-title"
				bind:value={quickNoteTitle}
				placeholder={i18n.t('editor.untitled')}
				onfocus={activateEditor}
			/>
			
			{#if isEditorActive}
				<div class="quick-note-actions">
					<button 
						type="button"
						class="btn btn-icon"
						onclick={toggleFullscreen}
						title={isFullscreen ? i18n.t('editor.exitFullscreen') : i18n.t('editor.fullscreen')}
					>
						{#if isFullscreen}
							<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M8 3v3a2 2 0 0 1-2 2H3" />
								<path d="M21 8h-3a2 2 0 0 1-2-2V3" />
								<path d="M3 16h3a2 2 0 0 1 2 2v3" />
								<path d="M16 21v-3a2 2 0 0 1 2-2h3" />
							</svg>
						{:else}
							<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M8 3H5a2 2 0 0 0-2 2v3" />
								<path d="M21 8V5a2 2 0 0 0-2-2h-3" />
								<path d="M3 16v3a2 2 0 0 0 2 2h3" />
								<path d="M16 21h3a2 2 0 0 0 2-2v-3" />
							</svg>
						{/if}
					</button>
					
					<button 
						type="button"
						class="btn btn-primary btn-sm"
						onclick={saveAndExpand}
					>
						{i18n.t('action.save')}
					</button>
				</div>
			{/if}
		</div>
		
		<div 
			class="quick-note-editor"
			bind:this={quickNoteContainer}
			onfocus={activateEditor}
			onclick={activateEditor}
			onkeydown={(e) => e.key === 'Enter' && activateEditor()}
			role="textbox"
			tabindex="0"
		>
			{#if !isEditorActive && !isEditorLoading}
				<span class="quick-note-placeholder">{i18n.t('editor.placeholder')}</span>
			{/if}
			{#if isEditorLoading}
				<span class="quick-note-loading">...</span>
			{/if}
		</div>
	</section>
	
	{#if !isFullscreen}
		<!-- Statistics -->
		<section class="stats-section">
			<h2 class="section-title">{i18n.t('dashboard.statistics')}</h2>
			<div class="stats-grid">
				<div class="stat-card">
					<span class="stat-value">{stats.notes}</span>
					<span class="stat-label">{i18n.t('dashboard.stats.notes')}</span>
				</div>
				<div class="stat-card">
					<span class="stat-value">{stats.documents}</span>
					<span class="stat-label">{i18n.t('dashboard.stats.documents')}</span>
				</div>
				<div class="stat-card">
					<span class="stat-value">{stats.storage}</span>
					<span class="stat-label">{i18n.t('dashboard.stats.storage')}</span>
				</div>
			</div>
		</section>
		
		<!-- Quick Actions -->
		<section class="quick-actions">
			<h2 class="section-title">{i18n.t('dashboard.quickActions')}</h2>
			<div class="actions-grid">
				<a href="/editor/new" class="action-card">
					<span class="action-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 20h9" />
							<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
						</svg>
					</span>
					<span class="action-label">{i18n.t('dashboard.newNote')}</span>
				</a>
				<a href="/literatur/upload" class="action-card">
					<span class="action-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="17 8 12 3 7 8" />
							<line x1="12" y1="3" x2="12" y2="15" />
						</svg>
					</span>
					<span class="action-label">{i18n.t('dashboard.uploadDoc')}</span>
				</a>
			</div>
		</section>
		
		<!-- Recent Notes -->
		<section class="recent-section">
			<h2 class="section-title">{i18n.t('dashboard.recentNotes')}</h2>
			<div class="notes-list">
				{#each recentNotes as note}
					<a href="/editor/{note.id}" class="note-card">
						<h3 class="note-title">{note.title}</h3>
						<p class="note-excerpt">{note.excerpt}</p>
						<span class="note-time">{formatTimeAgo(note.updatedAt)}</span>
					</a>
				{/each}
			</div>
		</section>
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
	
	/* Quick Note Section */
	.quick-note-section {
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-4);
		margin-bottom: var(--space-6);
		transition: all var(--transition-normal);
	}
	
	.quick-note-section.active {
		border-color: var(--color-active);
		box-shadow: 0 0 0 1px var(--color-active);
	}
	
	.quick-note-section.fullscreen {
		position: fixed;
		top: var(--header-height);
		left: 0;
		right: 0;
		bottom: var(--status-bar-height);
		margin: 0;
		border-radius: 0;
		z-index: var(--z-modal);
		display: flex;
		flex-direction: column;
	}
	
	.quick-note-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}
	
	.quick-note-title {
		flex: 1;
		font-family: var(--font-human);
		font-size: var(--font-size-lg);
		font-weight: 500;
		color: var(--color-text);
		background: transparent;
		border: none;
		outline: none;
		padding: var(--space-1) 0;
	}
	
	.quick-note-title::placeholder {
		color: var(--color-text-muted);
	}
	
	.quick-note-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	
	.quick-note-editor {
		min-height: 80px;
		font-family: var(--font-human);
		font-size: var(--font-size-base);
		color: var(--color-text);
		cursor: text;
	}
	
	.quick-note-section.fullscreen .quick-note-editor {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-4);
	}
	
	.quick-note-placeholder,
	.quick-note-loading {
		color: var(--color-text-muted);
		font-style: italic;
	}
	
	/* Editor.js overrides for quick note */
	.quick-note-editor :global(.codex-editor__redactor) {
		padding-bottom: var(--space-4) !important;
	}
	
	.quick-note-editor :global(.ce-block__content) {
		max-width: 100%;
	}
	
	/* Hide other sections when fullscreen */
	.dashboard.has-fullscreen-editor .stats-section,
	.dashboard.has-fullscreen-editor .quick-actions,
	.dashboard.has-fullscreen-editor .recent-section {
		display: none;
	}
</style>
