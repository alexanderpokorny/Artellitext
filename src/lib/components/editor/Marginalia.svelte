<!--
  Artellico - Marginalia Component
  
  Displays marginal notes alongside Editor.js blocks.
  Notes are positioned relative to their linked block and can be
  dragged, edited, and deleted.
-->

<script lang="ts">
	import { createI18n } from '$stores/i18n.svelte';
	import type { MarginaliaNote } from '$lib/types';
	
	// Props
	let { 
		marginalia = $bindable<MarginaliaNote[]>([]),
		readonly = false
	} = $props();
	
	const i18n = createI18n();
	
	// State
	let editingId = $state<string | null>(null);
	let draggedId = $state<string | null>(null);
	let containerElement: HTMLElement;
	
	// Add a new marginalia note
	export function addNote(blockId: string, blockTop: number): MarginaliaNote {
		const newNote: MarginaliaNote = {
			id: crypto.randomUUID(),
			blockId,
			content: '',
			top: blockTop,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		marginalia = [...marginalia, newNote];
		editingId = newNote.id;
		return newNote;
	}
	
	// Delete a marginalia note
	function deleteNote(id: string) {
		marginalia = marginalia.filter(m => m.id !== id);
		if (editingId === id) {
			editingId = null;
		}
	}
	
	// Update note content
	function updateContent(id: string, content: string) {
		marginalia = marginalia.map(m => 
			m.id === id ? { ...m, content, updatedAt: new Date() } : m
		);
	}
	
	// Update note position
	function updatePosition(id: string, newTop: number) {
		marginalia = marginalia.map(m => 
			m.id === id ? { ...m, top: Math.max(0, newTop), updatedAt: new Date() } : m
		);
	}
	
	// Sync positions with editor blocks
	export function syncPositions(blockPositions: Map<string, number>) {
		marginalia = marginalia.map(m => {
			const blockTop = blockPositions.get(m.blockId);
			if (blockTop !== undefined) {
				return { ...m, top: blockTop };
			}
			return m;
		});
	}
	
	// Drag handling
	function handleDragStart(e: DragEvent, id: string) {
		if (readonly) return;
		draggedId = id;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', id);
		}
	}
	
	function handleDragEnd(e: DragEvent, id: string) {
		if (!containerElement || readonly) return;
		
		const containerRect = containerElement.getBoundingClientRect();
		const newTop = e.clientY - containerRect.top;
		updatePosition(id, newTop);
		draggedId = null;
	}
	
	// Start editing on click
	function startEditing(id: string) {
		if (readonly) return;
		editingId = id;
	}
	
	// Stop editing on blur (with delay for button clicks)
	function stopEditing() {
		setTimeout(() => {
			editingId = null;
		}, 150);
	}
	
	// Handle keyboard in textarea
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			editingId = null;
		}
	}
	
	// Get notes sorted by position
	const sortedNotes = $derived(
		[...marginalia].sort((a, b) => a.top - b.top)
	);
</script>

<div class="marginalia-container" bind:this={containerElement}>
	{#if sortedNotes.length === 0 && !readonly}
		<div class="marginalia-empty">
			<span class="empty-hint">{i18n.t('editor.marginalia')}</span>
		</div>
	{/if}
	
	{#each sortedNotes as note (note.id)}
		<div 
			class="marginalia-note"
			class:editing={editingId === note.id}
			class:dragging={draggedId === note.id}
			style="top: {note.top}px"
			draggable={!readonly && editingId !== note.id}
			ondragstart={(e) => handleDragStart(e, note.id)}
			ondragend={(e) => handleDragEnd(e, note.id)}
			role="article"
			aria-label="Marginalia note"
		>
			{#if editingId === note.id}
				<div class="note-edit">
					<textarea
						class="note-textarea"
						value={note.content}
						oninput={(e) => updateContent(note.id, e.currentTarget.value)}
						onblur={stopEditing}
					onkeydown={(e) => handleKeydown(e)}
					placeholder={i18n.t('editor.marginalia') + '...'}
					></textarea>
					<div class="note-actions">
						<button 
							type="button"
							class="note-btn note-btn-delete"
							onclick={() => deleteNote(note.id)}
							title={i18n.t('action.delete')}
						>
							<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
							</svg>
						</button>
					</div>
				</div>
			{:else}
				<div 
					class="note-content"
					onclick={() => startEditing(note.id)}
					onkeydown={(e) => e.key === 'Enter' && startEditing(note.id)}
					role="button"
					tabindex="0"
				>
					{#if note.content}
						{note.content}
					{:else}
						<span class="note-placeholder">{i18n.t('editor.marginalia')}...</span>
					{/if}
				</div>
				<div class="note-connector"></div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.marginalia-container {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 200px;
	}
	
	.marginalia-empty {
		position: absolute;
		top: var(--space-4);
		left: 0;
		right: 0;
		text-align: center;
	}
	
	.empty-hint {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		opacity: 0.5;
	}
	
	.marginalia-note {
		position: absolute;
		left: 0;
		right: var(--space-2);
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-relaxed);
		color: var(--color-text-secondary);
		background: var(--color-bg-elevated);
		border-left: 2px solid var(--color-border);
		padding: var(--space-2);
		cursor: grab;
		transition: all var(--transition-fast);
		z-index: 1;
	}
	
	.marginalia-note:hover {
		background: var(--color-bg-hover);
		border-left-color: var(--color-text-muted);
	}
	
	.marginalia-note.editing {
		cursor: auto;
		border-left-color: var(--color-active);
		z-index: 10;
	}
	
	.marginalia-note.dragging {
		opacity: 0.5;
		cursor: grabbing;
	}
	
	.note-content {
		cursor: text;
		min-height: 1.5em;
		white-space: pre-wrap;
		word-break: break-word;
	}
	
	.note-placeholder {
		color: var(--color-text-muted);
		font-style: italic;
	}
	
	.note-edit {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	
	.note-textarea {
		width: 100%;
		min-height: 60px;
		font-family: inherit;
		font-size: inherit;
		line-height: inherit;
		color: var(--color-text);
		background: transparent;
		border: none;
		outline: none;
		resize: vertical;
		padding: 0;
	}
	
	.note-textarea::placeholder {
		color: var(--color-text-muted);
	}
	
	.note-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-1);
	}
	
	.note-btn {
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
	
	.note-btn:hover {
		background: var(--color-bg-sunken);
	}
	
	.note-btn-delete:hover {
		color: var(--color-error);
	}
	
	/* Connector line to editor block */
	.note-connector {
		position: absolute;
		top: 50%;
		right: -8px;
		width: 8px;
		height: 1px;
		background: var(--color-border);
	}
	
	.marginalia-note:hover .note-connector {
		background: var(--color-text-muted);
	}
</style>
