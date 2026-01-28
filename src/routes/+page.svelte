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
	import EditorSidebar from '$lib/components/editor/EditorSidebar.svelte';
	import TextStatsPanel from '$lib/components/editor/TextStatsPanel.svelte';
	import { analyzeText, extractTextFromBlocks, getEmptyStats, type TextStats } from '$lib/services/textAnalysis';
	
	let { data }: { data: PageData } = $props();
	
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
	
	let notes = $state<NoteItem[]>([]);
	// Track if notes have been initialized from server data
	let notesInitialized = $state(false);
	
	// Initialize notes from server data (using $effect to avoid state_referenced_locally)
	$effect(() => {
		if (!notesInitialized && data.recentNotes) {
			notes = data.recentNotes as NoteItem[];
			notesInitialized = true;
		}
	});
	
	let viewMode = $state<ViewMode>('grid-small');
	let sortBy = $state<SortBy>('updated');
	let sortOrder = $state<SortOrder>('desc');
	let isLoadingMore = $state(false);
	let hasMore = $state(true);
	let currentPage = $state(1);
	let expandedNoteId = $state<string | null>(null);
	let loadMoreTrigger = $state<HTMLElement | null>(null);
	
	// Expanded editor state
	let expandedEditorContainer = $state<HTMLElement | undefined>(undefined);
	let expandedEditor: any = $state(null);
	let expandedNoteTitle = $state('');
	let expandedNoteTags = $state<string[]>([]);
	let expandedNewTag = $state('');
	let expandedMarginalia = $state<MarginaliaNote[]>([]);
	let expandedTextStats = $state<TextStats>(getEmptyStats());
	let expandedSaveStatus = $state<'saved' | 'saving' | 'unsaved'>('saved');
	let expandedLeftTab = $state<'marginalia' | 'spellcheck'>('marginalia');
let expandedRightTab = $state<'tags' | 'references' | 'stats'>('tags');
	
	// Width mode for inline editor (wide/narrow)
	let expandedWidthMode = $state<'narrow' | 'wide'>('narrow');

	// Tab configurations for expanded editor
	const expandedLeftTabs = [
		{ id: 'marginalia', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', tooltipKey: 'sidebar.marginalia' },
		{ id: 'spellcheck', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>', tooltipKey: 'sidebar.spellcheck' },
	];
	
	const expandedRightTabs = [
		{ id: 'tags', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>', tooltipKey: 'sidebar.tags' },
		{ id: 'references', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>', tooltipKey: 'sidebar.references' },
		{ id: 'stats', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>', tooltipKey: 'sidebar.stats' },
	];
	
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
	async function handleNoteClick(noteId: string) {
		if (expandedNoteId === noteId) {
			// Already expanded, go to full editor
			goto(`/editor/${noteId}`);
		} else {
			// Close previous expanded editor
			await closeExpandedEditor();
			expandedNoteId = noteId;
			// Load note data for expanded view
			const note = notes.find(n => n.id === noteId);
			if (note) {
				expandedNoteTitle = note.title || i18n.t('editor.untitled');
				expandedNoteTags = [...(note.tags || [])];
				// Initialize expanded editor after DOM update
				setTimeout(() => initExpandedEditor(note), 50);
			}
		}
	}
	
	// Close expanded editor and save
	async function closeExpandedEditor() {
		if (expandedEditor) {
			if (expandedSaveStatus === 'unsaved') {
				await saveExpandedNote();
			}
			expandedEditor.destroy();
			expandedEditor = null;
		}
		expandedNoteId = null;
		expandedMarginalia = [];
		expandedTextStats = getEmptyStats();
	}
	
	// Initialize expanded editor with note content
	async function initExpandedEditor(note: NoteItem) {
		if (!browser || !expandedEditorContainer) return;
		
		try {
			const EditorJS = (await import('@editorjs/editorjs')).default;
			const Header = (await import('@editorjs/header')).default;
			const List = (await import('@editorjs/list')).default;
			const Quote = (await import('@editorjs/quote')).default;
			// @ts-expect-error No type declarations available
			const DragDrop = (await import('editorjs-drag-drop')).default;
			
			const { MathTool, MathInlineTool, MathParagraph, CodeTool, MermaidTool, CitationTool, BibliographyTool } = await import('$lib/editor/tools');
			await import('katex/dist/katex.min.css');
			await import('highlight.js/styles/github-dark.css');
			
			expandedEditor = new EditorJS({
				holder: expandedEditorContainer,
				data: note.content || { blocks: [] },
				placeholder: i18n.t('editor.placeholder'),
				autofocus: true,
				minHeight: 200,
				inlineToolbar: ['bold', 'italic', 'link', 'mathInline'],
				defaultBlock: 'paragraph',
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
					code: { class: CodeTool },
					math: {
						// @ts-expect-error Custom tool
						class: MathTool,
						config: { placeholder: 'LaTeX (z.B. E = mc^2)' },
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
					expandedSaveStatus = 'unsaved';
					await updateExpandedStats();
				},
				onReady: () => {
					new DragDrop(expandedEditor);
					updateExpandedStats();
				},
			});
		} catch (err) {
			console.error('Failed to initialize expanded editor:', err);
		}
	}
	
	// Update expanded editor text stats
	async function updateExpandedStats() {
		if (!expandedEditor) return;
		try {
			const data = await expandedEditor.save();
			const text = extractTextFromBlocks(data.blocks || []);
			expandedTextStats = analyzeText(text);
		} catch {
			// Ignore
		}
	}
	
	// Save expanded note
	async function saveExpandedNote() {
		if (!expandedEditor || !expandedNoteId) return;
		
		expandedSaveStatus = 'saving';
		try {
			const content = await expandedEditor.save();
			const response = await fetch(`/api/notes/${expandedNoteId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: expandedNoteTitle || i18n.t('editor.untitled'),
					content,
					tags: expandedNoteTags,
				}),
			});
			
			if (response.ok) {
				expandedSaveStatus = 'saved';
				// Update note in list
				const noteIndex = notes.findIndex(n => n.id === expandedNoteId);
				if (noteIndex >= 0) {
					notes[noteIndex] = {
						...notes[noteIndex],
						title: expandedNoteTitle,
						content,
						tags: expandedNoteTags,
						updated_at: new Date().toISOString(),
					};
				}
			} else {
				throw new Error('Save failed');
			}
		} catch {
			expandedSaveStatus = 'unsaved';
		}
	}
	
	// Add tag in expanded view
	function addExpandedTag() {
		const tag = expandedNewTag.trim();
		if (tag && !expandedNoteTags.includes(tag)) {
			expandedNoteTags = [...expandedNoteTags, tag];
			expandedNewTag = '';
			expandedSaveStatus = 'unsaved';
		}
	}
	
	// Remove tag in expanded view
	function removeExpandedTag(tag: string) {
		expandedNoteTags = expandedNoteTags.filter(t => t !== tag);
		expandedSaveStatus = 'unsaved';
	}
	
	// Reference Import/Export Dialog State
	let showReferenceDialog = $state(false);
	let referenceDialogMode = $state<'import' | 'export'>('import');
	let referenceFormat = $state<'bibtex' | 'csv' | 'excel'>('bibtex');
	// noinspection JSUnusedLocalSymbols - used by bind:this
	let _referenceFileInput = $state<HTMLInputElement | undefined>(undefined);
	let importedReferences = $state<any[]>([]);
	
	// Open reference import dialog
	function openReferenceImport() {
		referenceDialogMode = 'import';
		showReferenceDialog = true;
	}
	
	// Open reference export dialog
	function openReferenceExport() {
		referenceDialogMode = 'export';
		showReferenceDialog = true;
	}
	
	// Close reference dialog
	function closeReferenceDialog() {
		showReferenceDialog = false;
		importedReferences = [];
	}
	
	// Handle file selection for import
	async function handleReferenceFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files?.length) return;
		
		const file = input.files[0];
		const text = await file.text();
		
		try {
			if (referenceFormat === 'bibtex') {
				const { parseBibtex } = await import('$lib/services/referenceParser');
				importedReferences = parseBibtex(text);
			} else if (referenceFormat === 'csv') {
				const { parseCsv } = await import('$lib/services/referenceParser');
				importedReferences = parseCsv(text);
			}
		} catch (err) {
			console.error('Failed to parse references:', err);
		}
	}
	
	// Save imported references to database
	async function saveImportedReferences() {
		for (const ref of importedReferences) {
			try {
				await fetch('/api/literature', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(ref),
				});
			} catch (err) {
				console.error('Failed to save reference:', err);
			}
		}
		closeReferenceDialog();
	}
	
	// Export references
	async function exportReferences() {
		try {
			const response = await fetch('/api/literature');
			if (!response.ok) throw new Error('Failed to fetch references');
			
			const { items } = await response.json();
			const { exportToBibtex, exportToCsv, exportToExcel } = await import('$lib/services/referenceParser');
			
			let content: string | Blob;
			let filename: string;
			let mimeType: string;
			
			if (referenceFormat === 'bibtex') {
				content = exportToBibtex(items);
				filename = 'references.bib';
				mimeType = 'application/x-bibtex';
			} else if (referenceFormat === 'csv') {
				content = exportToCsv(items);
				filename = 'references.csv';
				mimeType = 'text/csv';
			} else {
				content = await exportToExcel(items);
				filename = 'references.xlsx';
				mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
			}
			
			// Download file
			const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
			
			closeReferenceDialog();
		} catch (err) {
			console.error('Export failed:', err);
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
	
	// Marginalia functions for expanded editor - click to create at position
	let expandedMarginaliaContainer = $state<HTMLElement | undefined>(undefined);
	let expandedEditingMarginaliaId = $state<string | null>(null);
	let expandedDraggingMarginaliaId = $state<string | null>(null);
	
	function handleExpandedMarginaliaClick(e: MouseEvent) {
		// Don't create new note if clicking existing one
		if ((e.target as HTMLElement).closest('.marginalia-note')) return;
		
		const container = expandedMarginaliaContainer;
		if (!container) return;
		
		const rect = container.getBoundingClientRect();
		const clickY = e.clientY - rect.top + container.scrollTop;
		
		const newMarg: MarginaliaNote = {
			id: crypto.randomUUID(),
			blockId: '',
			content: '',
			top: clickY,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		
		expandedMarginalia = [...expandedMarginalia, newMarg];
		expandedEditingMarginaliaId = newMarg.id;
		expandedSaveStatus = 'unsaved';
	}
	
	function updateExpandedMarginaliaContent(id: string, content: string) {
		expandedMarginalia = expandedMarginalia.map(m =>
			m.id === id ? { ...m, content, updatedAt: new Date() } : m
		);
		expandedSaveStatus = 'unsaved';
	}
	
	// Reserved for future context menu implementation
	// noinspection JSUnusedLocalSymbols
	function _deleteExpandedMarginalia(id: string) {
		expandedMarginalia = expandedMarginalia.filter(m => m.id !== id);
		expandedSaveStatus = 'unsaved';
	}
	
	function handleExpandedMarginaliaDragStart(e: MouseEvent, id: string) {
		expandedDraggingMarginaliaId = id;
		e.preventDefault();
	}
	
	function handleExpandedMarginaliaDrag(e: MouseEvent) {
		if (!expandedDraggingMarginaliaId || !expandedMarginaliaContainer) return;
		
		const rect = expandedMarginaliaContainer.getBoundingClientRect();
		const newTop = Math.max(0, e.clientY - rect.top + expandedMarginaliaContainer.scrollTop);
		
		expandedMarginalia = expandedMarginalia.map(m =>
			m.id === expandedDraggingMarginaliaId ? { ...m, top: newTop, updatedAt: new Date() } : m
		);
	}
	
	function handleExpandedMarginaliaDragEnd() {
		if (expandedDraggingMarginaliaId) {
			expandedDraggingMarginaliaId = null;
			expandedSaveStatus = 'unsaved';
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
		if (event.key === 'Escape') {
			if (showContextMenu) {
				closeContextMenu();
			} else if (expandedNoteId) {
				closeExpandedEditor();
			}
		}
	}
	
	// Handle click outside expanded editor to close it
	function handleEditorClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		// Check if click is outside the inline-expanded-editor
		if (expandedNoteId && !target.closest('.inline-expanded-editor')) {
			closeExpandedEditor();
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
			expandedEditor?.destroy();
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

<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
<div class="dashboard" onclick={handleEditorClickOutside} onkeypress={() => {}} role="main">
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
				{#if expandedNoteId === note.id}
					<!-- Inline Expanded Editor with unified sticky header -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
					<div class="inline-expanded-editor" class:wide-mode={expandedWidthMode === 'wide'} onclick={(e) => e.stopPropagation()} onkeypress={() => {}} role="region" aria-label="Editor">
						<!-- Unified Sticky Header: Left Tabs | Title + Fullscreen | Right Tabs -->
						<div class="unified-editor-header">
							<!-- Left sidebar tabs -->
							<EditorSidebar 
								side="left" 
								tabs={expandedLeftTabs} 
								activeTab={expandedLeftTab}
								onTabChange={(id) => expandedLeftTab = id as 'marginalia' | 'spellcheck'}
								showTabsOnly={true}
							/>
							
							<!-- Central header with title and fullscreen -->
							<div class="central-header">
								<input
									type="text"
									class="title-input"
									bind:value={expandedNoteTitle}
									placeholder={i18n.t('editor.untitled')}
									oninput={() => expandedSaveStatus = 'unsaved'}
								/>
								<div class="header-actions">
									<span class="save-status" class:saved={expandedSaveStatus === 'saved'} class:saving={expandedSaveStatus === 'saving'}>
										{#if expandedSaveStatus === 'saved'}
											✓
										{:else if expandedSaveStatus === 'saving'}
											...
										{:else}
											●
										{/if}
									</span>
									<button 
										type="button" 
											class="width-toggle-btn" 
											class:wide={expandedWidthMode === 'wide'}
											onclick={() => expandedWidthMode = expandedWidthMode === 'narrow' ? 'wide' : 'narrow'}
											title={expandedWidthMode === 'narrow' ? i18n.t('editor.expandWidth') : i18n.t('editor.narrowWidth')}
										>
											{#if expandedWidthMode === 'narrow'}
												<!-- Narrow mode - show expand icon (wider lines) -->
												<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
													<line x1="3" y1="6" x2="21" y2="6" />
													<line x1="3" y1="12" x2="21" y2="12" />
													<line x1="3" y1="18" x2="21" y2="18" />
												</svg>
											{:else}
												<!-- Wide mode - show collapse icon (narrower lines) -->
												<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
													<line x1="6" y1="6" x2="18" y2="6" />
													<line x1="6" y1="12" x2="18" y2="12" />
													<line x1="6" y1="18" x2="18" y2="18" />
												</svg>
											{/if}
										</button>
										<button 
											type="button" 
											class="fullscreen-btn" 
											onclick={() => goto(`/editor/${expandedNoteId}`)}
											title={i18n.t('editor.fullscreen')}
										>
											<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<path d="M8 3H5a2 2 0 0 0-2 2v3" />
												<path d="M21 8V5a2 2 0 0 0-2-2h-3" />
												<path d="M3 16v3a2 2 0 0 0 2 2h3" />
												<path d="M16 21h3a2 2 0 0 0 2-2v-3" />
											</svg>
										</button>
									</div>
								</div>
							
							<!-- Right sidebar tabs -->
							<EditorSidebar 
								side="right" 
								tabs={expandedRightTabs} 
								activeTab={expandedRightTab}
								onTabChange={(id) => expandedRightTab = id as 'tags' | 'references' | 'stats'}
								showTabsOnly={true}
							/>
						</div>
						
						<!-- Editor content area -->
						<div class="expanded-editor-body">
							<!-- Left Sidebar Content -->
							<EditorSidebar 
								side="left" 
								tabs={expandedLeftTabs} 
								activeTab={expandedLeftTab}
								onTabChange={(id) => expandedLeftTab = id as 'marginalia' | 'spellcheck'}
								stickyContent={false}
							>
								{#if expandedLeftTab === 'marginalia'}
									<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
									<div 
										class="marginalia-content marginalia-column"
										bind:this={expandedMarginaliaContainer}
										onclick={handleExpandedMarginaliaClick}
										onkeypress={() => {}}
										onmousemove={handleExpandedMarginaliaDrag}
										onmouseup={handleExpandedMarginaliaDragEnd}
										onmouseleave={handleExpandedMarginaliaDragEnd}
										title={i18n.t('editor.newMarginalia')}
										role="list"
										aria-label="Marginalia"
									>
										{#each expandedMarginalia as margNote (margNote.id)}
											<div 
												class="marginalia-note"
												class:editing={expandedEditingMarginaliaId === margNote.id}
												class:dragging={expandedDraggingMarginaliaId === margNote.id}
												style="top: {margNote.top}px"
											>
												<div 
													class="marginalia-drag-handle"
													onmousedown={(e) => handleExpandedMarginaliaDragStart(e, margNote.id)}
													role="slider"
													aria-label="Drag to reposition"
													tabindex="0"
													aria-valuenow={margNote.top}
												></div>
												<textarea
													class="marginalia-textarea"
													value={margNote.content}
													placeholder={i18n.t('editor.marginalia') + '...'}
													oninput={(e) => updateExpandedMarginaliaContent(margNote.id, e.currentTarget.value)}
													onfocus={() => expandedEditingMarginaliaId = margNote.id}
													onblur={() => setTimeout(() => expandedEditingMarginaliaId = null, 100)}
													onclick={(e) => e.stopPropagation()}
												></textarea>
											</div>
										{/each}
										{#if expandedMarginalia.length === 0}
											<p class="sidebar-empty-hint marginalia-hint">{i18n.t('editor.newMarginalia')}</p>
										{/if}
									</div>
								{:else if expandedLeftTab === 'spellcheck'}
									<div class="spellcheck-content">
										<p class="sidebar-empty-hint">Rechtschreibprüfung wird in einer zukünftigen Version verfügbar sein.</p>
									</div>
								{/if}
							</EditorSidebar>
							
							<!-- Main Editor -->
							<main class="expanded-editor-main">
								<div class="expanded-editor-container prose" bind:this={expandedEditorContainer}></div>
							</main>
							
							<!-- Right Sidebar Content -->
							<EditorSidebar 
								side="right" 
								tabs={expandedRightTabs} 
								activeTab={expandedRightTab}
								onTabChange={(id) => expandedRightTab = id as 'tags' | 'references' | 'stats'}
								stickyContent={expandedRightTab === 'stats'}
							>
								{#if expandedRightTab === 'tags'}
									<div class="tags-content">
										<div class="tags-list">
											{#each expandedNoteTags as tag}
												<span class="tag">
													{tag}
													<button type="button" class="tag-remove" onclick={() => removeExpandedTag(tag)} aria-label={i18n.t('action.delete')}>
														×
													</button>
												</span>
											{/each}
										</div>
										
										<input
											type="text"
											class="tag-input"
											bind:value={expandedNewTag}
											placeholder={i18n.t('editor.addTag')}
											onkeydown={(e) => e.key === 'Enter' && addExpandedTag()}
										/>
									</div>
								{:else if expandedRightTab === 'references'}
									<div class="references-content">
										<div class="references-actions">
											<button type="button" class="btn btn-sm" onclick={openReferenceImport}>
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
													<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
													<polyline points="17 8 12 3 7 8"/>
													<line x1="12" y1="3" x2="12" y2="15"/>
												</svg>
												Import
											</button>
											<button type="button" class="btn btn-sm" onclick={openReferenceExport}>
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
													<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
													<polyline points="7 10 12 15 17 10"/>
													<line x1="12" y1="15" x2="12" y2="3"/>
												</svg>
												Export
											</button>
										</div>
										<p class="sidebar-empty-hint">{i18n.t('references.empty')}</p>
									</div>
								{:else if expandedRightTab === 'stats'}
									<TextStatsPanel stats={expandedTextStats} />
								{/if}
							</EditorSidebar>
						</div>
					</div>
				{:else}
					<!-- Regular Note Card -->
					<button
						type="button"
						class="note-card"
						class:expanded={viewMode === 'expanded'}
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
						
						{#if viewMode !== 'list'}
							<p class="note-excerpt">{getExcerpt(note, viewMode === 'expanded' ? 500 : 150)}</p>
						{/if}
						
						<div class="note-card-footer">
							<span class="note-time">{formatTimeAgo(note.updated_at)}</span>
							<span class="note-preview-symbol" title={getExcerpt(note, 50)}>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
									<polyline points="14 2 14 8 20 8" />
									<line x1="16" y1="13" x2="8" y2="13" />
									<line x1="16" y1="17" x2="8" y2="17" />
									<polyline points="10 9 9 9 8 9" />
								</svg>
							</span>
						</div>
					</button>
				{/if}
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
	
	<!-- Reference Import/Export Dialog -->
	{#if showReferenceDialog}
		<div class="modal-backdrop" onclick={closeReferenceDialog} onkeydown={(e) => e.key === 'Escape' && closeReferenceDialog()} role="presentation">
			<div class="modal-dialog" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && closeReferenceDialog()}>
				<header class="modal-header">
					<h2 class="modal-title">
						{referenceDialogMode === 'import' ? i18n.t('references.import') : i18n.t('references.export')}
					</h2>
					<button type="button" class="modal-close" onclick={closeReferenceDialog} aria-label={i18n.t('action.close')}>
						×
					</button>
				</header>
				
				<div class="modal-body">
					<!-- Format selection -->
					<fieldset class="form-group">
						<legend class="form-label">{i18n.t('references.format')}</legend>
						<div class="format-options" role="radiogroup">
							<label class="format-option">
								<input type="radio" bind:group={referenceFormat} value="bibtex" id="format-bibtex" />
								<span>BibTeX (.bib)</span>
							</label>
							<label class="format-option">
								<input type="radio" bind:group={referenceFormat} value="csv" id="format-csv" />
								<span>CSV (.csv)</span>
							</label>
							<label class="format-option">
								<input type="radio" bind:group={referenceFormat} value="excel" id="format-excel" />
								<span>Excel (.xlsx)</span>
							</label>
						</div>
					</fieldset>
					
					{#if referenceDialogMode === 'import'}
						<!-- File input for import -->
						<div class="form-group">
							<label class="form-label" for="reference-file-input">{i18n.t('references.selectFile')}</label>
							<input 
								type="file" 
								id="reference-file-input"
								bind:this={_referenceFileInput}
								accept={referenceFormat === 'bibtex' ? '.bib,.bibtex' : referenceFormat === 'csv' ? '.csv' : '.xlsx,.xls'}
								onchange={handleReferenceFileSelect}
								class="file-input"
							/>
						</div>
						
						<!-- Preview imported references -->
						{#if importedReferences.length > 0}
							<div class="import-preview">
								<h4>{importedReferences.length} {i18n.t('references.found')}</h4>
								<ul class="reference-list">
									{#each importedReferences.slice(0, 5) as ref}
										<li class="reference-item">
											<strong>{ref.title}</strong>
											{#if ref.authors?.length}
												<span class="reference-authors">{ref.authors.join(', ')}</span>
											{/if}
											{#if ref.year}
												<span class="reference-year">({ref.year})</span>
											{/if}
										</li>
									{/each}
									{#if importedReferences.length > 5}
										<li class="reference-item more">+{importedReferences.length - 5} {i18n.t('references.more')}</li>
									{/if}
								</ul>
							</div>
						{/if}
					{:else}
						<!-- Export info -->
						<p class="export-info">{i18n.t('references.exportInfo')}</p>
					{/if}
				</div>
				
				<footer class="modal-footer">
					<button type="button" class="btn btn-ghost" onclick={closeReferenceDialog}>
						{i18n.t('action.cancel')}
					</button>
					{#if referenceDialogMode === 'import'}
						<button 
							type="button" 
							class="btn btn-primary" 
							onclick={saveImportedReferences}
							disabled={importedReferences.length === 0}
						>
							{i18n.t('references.importSelected')}
						</button>
					{:else}
						<button type="button" class="btn btn-primary" onclick={exportReferences}>
							{i18n.t('references.exportNow')}
						</button>
					{/if}
				</footer>
			</div>
		</div>
	{/if}
	
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
	
	.note-time {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	
	.note-preview-symbol {
		display: flex;
		align-items: center;
		color: var(--color-text-muted);
		opacity: 0.6;
	}
	
	.note-preview-symbol:hover {
		opacity: 1;
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
	
	/* Inline Expanded Editor */
	.inline-expanded-editor {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-active);
		border-radius: var(--radius-md);
		overflow: hidden;
		min-height: 150px;
		max-height: 50vh;
	}
	
	/* Wide mode for inline editor */
	.inline-expanded-editor.wide-mode {
		max-height: none;
		min-height: 70vh;
	}
	
	/* Light theme: same background as marginalia */
	:global(html:not(.dark)) .inline-expanded-editor {
		background: var(--color-bg-elevated);
	}
	
	/* Dark theme: pure black background */
	:global(html.dark) .inline-expanded-editor {
		background: #000;
	}
	
	:global(html.dark) .inline-expanded-editor .expanded-editor-main {
		background: #000;
	}
	
	:global(html.dark) .inline-expanded-editor .central-header {
		background: #000;
		border-color: var(--color-border-subtle);
	}
	
	/* Unified Sticky Header */
	.unified-editor-header {
		display: grid;
		grid-template-columns: var(--margin-column-width) 1fr var(--tag-column-width);
		position: sticky;
		top: 0;
		z-index: 10;
		background: var(--color-bg-sunken);
		border-bottom: 1px solid var(--color-border-subtle);
	}
	
	.central-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-4);
		background: var(--color-bg);
		border-left: 1px solid var(--color-border-subtle);
		border-right: 1px solid var(--color-border-subtle);
	}
	
	.title-input {
		flex: 1;
		padding: var(--space-1) var(--space-2);
		font-family: var(--font-human);
		font-size: var(--font-size-base);
		font-weight: 500;
		color: var(--color-text);
		background: transparent;
		border: none;
		border-bottom: 1px solid transparent;
		outline: none;
		transition: border-color var(--transition-fast);
	}
	
	.title-input:focus {
		border-bottom-color: var(--color-active);
	}
	
	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	
	.save-status {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	
	.save-status.saved { color: var(--color-success); }
	.save-status.saving { color: var(--color-warning); }
	
	.fullscreen-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-1);
		background: transparent;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}
	
	.fullscreen-btn:hover {
		color: var(--color-text);
		background: var(--color-bg-hover);
	}
	
	/* Width toggle button */
	.width-toggle-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-1);
		background: transparent;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}
	
	.width-toggle-btn:hover {
		color: var(--color-text);
		background: var(--color-bg-hover);
	}
	
	.width-toggle-btn.wide {
		color: var(--color-active);
	}
	
	/* Editor Body (content area below header) */
	.expanded-editor-body {
		display: grid;
		grid-template-columns: var(--margin-column-width) 1fr var(--tag-column-width);
		flex: 1;
		overflow: hidden;
	}
	
	.expanded-editor-main {
		padding: var(--space-6) var(--space-8);
		overflow-y: auto;
		display: flex;
		justify-content: center;
		background: var(--color-bg-elevated);
	}
	
	.expanded-editor-container {
		width: 100%;
		max-width: 100%;
		min-height: 100%;
	}
	
	/* Editor.js overrides for expanded editor */
	.expanded-editor-container :global(.ce-block__content) {
		max-width: 100%;
	}
	
	.expanded-editor-container :global(.ce-toolbar__content) {
		max-width: 100%;
	}
	
	.expanded-editor-container :global(.codex-editor__redactor) {
		padding-bottom: 100px;
	}
	
	/* Expanded view reuses sidebar styles from EditorSidebar */
	.inline-expanded-editor .marginalia-content {
		min-height: 200px;
	}
	
	.inline-expanded-editor .sidebar-empty-hint {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-align: center;
		padding: var(--space-4);
	}
	
	.inline-expanded-editor .tags-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	
	.inline-expanded-editor .tags-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	
	.inline-expanded-editor .tag {
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
	
	.inline-expanded-editor .tag-remove {
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
	
	.inline-expanded-editor .tag-remove:hover {
		color: var(--color-error);
	}
	
	.inline-expanded-editor .tag-input {
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
	
	/* Marginalia Column in Inline Editor */
	.inline-expanded-editor .marginalia-column {
		position: relative;
		min-height: 200px;
		cursor: text;
	}
	
	.inline-expanded-editor .marginalia-note {
		position: absolute;
		left: 0;
		right: 0;
		display: flex;
		gap: var(--space-1);
		padding: var(--space-1);
		background: var(--color-bg-elevated);
		border-radius: var(--radius-sm);
		transition: box-shadow var(--transition-fast);
	}
	
	.inline-expanded-editor .marginalia-note:hover,
	.inline-expanded-editor .marginalia-note.editing {
		box-shadow: var(--shadow-sm);
	}
	
	.inline-expanded-editor .marginalia-note.dragging {
		opacity: 0.7;
		cursor: grabbing;
	}
	
	.inline-expanded-editor .marginalia-drag-handle {
		width: 8px;
		min-height: 20px;
		cursor: grab;
		background: var(--color-border);
		border-radius: 2px;
		opacity: 0.4;
		transition: opacity var(--transition-fast);
	}
	
	.inline-expanded-editor .marginalia-drag-handle:hover {
		opacity: 0.8;
	}
	
	.inline-expanded-editor .marginalia-textarea {
		flex: 1;
		min-height: 20px;
		padding: 0;
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
	
	.inline-expanded-editor .marginalia-hint {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}
	
	/* Mobile: Hide sidebars in expanded view */
	@media (max-width: 1024px) {
		.unified-editor-header {
			grid-template-columns: auto 1fr auto;
		}
		
		.expanded-editor-body {
			grid-template-columns: 1fr;
		}
		
		.expanded-editor-body :global(.editor-sidebar) {
			display: none;
		}
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
		
		.unified-editor-header {
			grid-template-columns: 1fr;
		}
		
		.central-header {
			padding: var(--space-2);
			border: none;
		}
		
		:global(.sidebar-tabs-standalone) {
			display: none;
		}
	}
	
	/* References Content */
	.references-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	
	.references-actions {
		display: flex;
		gap: var(--space-2);
	}
	
	.references-actions .btn {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		flex: 1;
		justify-content: center;
	}
	
	/* Modal Dialog */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	
	.modal-dialog {
		background: var(--color-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		max-width: 500px;
		width: 90%;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
	}
	
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4);
		border-bottom: 1px solid var(--color-border-subtle);
	}
	
	.modal-title {
		font-family: var(--font-human);
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}
	
	.modal-close {
		background: transparent;
		border: none;
		font-size: var(--font-size-xl);
		color: var(--color-text-muted);
		cursor: pointer;
		line-height: 1;
	}
	
	.modal-close:hover {
		color: var(--color-text);
	}
	
	.modal-body {
		padding: var(--space-4);
		overflow-y: auto;
	}
	
	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		padding: var(--space-4);
		border-top: 1px solid var(--color-border-subtle);
	}
	
	/* Form elements */
	.form-group {
		margin-bottom: var(--space-4);
	}
	
	.form-label {
		display: block;
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text);
		margin-bottom: var(--space-2);
	}
	
	.format-options {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	
	.format-option {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		cursor: pointer;
	}
	
	.format-option:hover {
		color: var(--color-text);
	}
	
	.file-input {
		width: 100%;
		padding: var(--space-2);
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		color: var(--color-text);
		background: var(--color-bg-sunken);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
	}
	
	.import-preview {
		background: var(--color-bg-sunken);
		border-radius: var(--radius-md);
		padding: var(--space-3);
	}
	
	.import-preview h4 {
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text);
		margin: 0 0 var(--space-2);
	}
	
	.reference-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	
	.reference-item {
		padding: var(--space-2) 0;
		border-bottom: 1px solid var(--color-border-subtle);
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
	}
	
	.reference-item:last-child {
		border-bottom: none;
	}
	
	.reference-item strong {
		display: block;
		color: var(--color-text);
		margin-bottom: var(--space-1);
	}
	
	.reference-authors {
		color: var(--color-text-secondary);
	}
	
	.reference-year {
		color: var(--color-text-muted);
		margin-left: var(--space-1);
	}
	
	.reference-item.more {
		font-style: italic;
		color: var(--color-text-muted);
	}
	
	.export-info {
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		margin: 0;
	}
</style>
