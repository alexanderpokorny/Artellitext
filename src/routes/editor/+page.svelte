<!--
  Artellico - Fullscreen Editor Page
  
  Uses EditorCore component for consistent editing experience.
  Accessible via /editor for new notes.
-->

<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { createI18n } from '$stores/i18n.svelte';
	import { getEditorStats } from '$stores/editorStats.svelte';
	import EditorCore from '$lib/components/editor/EditorCore.svelte';
	
	const i18n = createI18n();
	const editorStats = getEditorStats();
	
	// Activate editor stats for footer
	$effect(() => {
		editorStats.setActive(true);
		return () => editorStats.setActive(false);
	});
	
	// Save handler
	async function handleSave(saveData: { title: string; content: any; tags: string[]; marginalia: any[] }) {
		const noteData = {
			title: saveData.title.trim() || i18n.t('editor.untitled'),
			content: saveData.content,
			tags: saveData.tags || [],
		};
		
		// Save to local cache first (offline support)
		if (browser) {
			try {
				const { saveNoteToCache } = await import('$stores/offline');
				await saveNoteToCache({ ...noteData, marginalia: saveData.marginalia, noteId: null });
			} catch (cacheErr) {
				console.warn('Cache save failed:', cacheErr);
			}
		}
		
		// Sync to server - new note
		const response = await fetch('/api/notes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(noteData),
		});
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.error || `HTTP ${response.status}`);
		}
		
		// Redirect to edit URL with ID
		const result = await response.json();
		if (result.id) {
			goto(`/editor/${result.id}`, { replaceState: true });
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
		noteId={null}
		initialTitle=""
		initialContent={null}
		initialTags={[]}
		initialMarginalia={[]}
		onSave={handleSave}
		onClose={handleClose}
	/>
</div>

<style>
	.editor-fullscreen-page {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: var(--z-modal);
		background: var(--color-bg);
	}
	
	:global(html.dark) .editor-fullscreen-page {
		background: #000;
	}
</style>
