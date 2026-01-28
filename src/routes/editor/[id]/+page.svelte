<!--
  Artellico - Fullscreen Editor Page (Existing Note)
  
  Uses EditorCore component for consistent editing experience.
  Accessible via /editor/:id for existing notes.
-->

<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { createI18n } from '$stores/i18n.svelte';
	import { getEditorStats } from '$stores/editorStats.svelte';
	import EditorCore from '$lib/components/editor/EditorCore.svelte';
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
	
	const i18n = createI18n();
	const editorStats = getEditorStats();
	
	// Get note data - use $derived for reactivity
	const note = $derived(data.note);
	const noteId = $derived(note?.id || null);
	
	// Activate editor stats for footer
	$effect(() => {
		editorStats.setActive(true);
		return () => editorStats.setActive(false);
	});
	
	// Save handler
	async function handleSave(saveData: { title: string; content: any; tags: string[]; marginalia: any[] }) {
		if (!noteId) return;
		
		const noteData = {
			title: saveData.title.trim() || i18n.t('editor.untitled'),
			content: saveData.content,
			tags: saveData.tags || [],
		};
		
		// Save to local cache first (offline support)
		if (browser) {
			try {
				const { saveNoteToCache } = await import('$stores/offline');
				await saveNoteToCache({ ...noteData, marginalia: saveData.marginalia, noteId });
			} catch (cacheErr) {
				console.warn('Cache save failed:', cacheErr);
			}
		}
		
		// Sync to server - update existing note
		const response = await fetch(`/api/notes/${noteId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(noteData),
		});
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.error || `HTTP ${response.status}`);
		}
	}
	
	// Close handler - go back to dashboard
	function handleClose() {
		goto('/');
	}
</script>

<div class="editor-fullscreen-page">
	<EditorCore
		mode="fullscreen"
		{noteId}
		initialTitle={note?.title || ''}
		initialContent={note?.content || null}
		initialTags={note?.tags || []}
		initialMarginalia={note?.marginalia || []}
		onSave={handleSave}
		onClose={handleClose}
	/>
</div>

<style>
	.editor-fullscreen-page {
		height: calc(100vh - var(--header-height) - var(--status-bar-height));
		margin: calc(-1 * var(--site-padding));
		background: var(--color-bg);
	}
	
	:global(html.dark) .editor-fullscreen-page {
		background: #000;
	}
</style>
