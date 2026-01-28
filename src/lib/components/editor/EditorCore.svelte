<!--
  Artellico - EditorCore Component
  
  Unified Editor component that works both inline (in dashboard) and fullscreen (maxview).
  Features: Block-based editing, Marginalia, Tags, Text stats, Width toggle, LaTeX support.
-->

<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { createI18n } from '$stores/i18n.svelte';
	import { analyzeText, extractTextFromBlocks, getEmptyStats, type TextStats } from '$lib/services/textAnalysis';
	import { aiStore } from '$stores/ai.svelte';
	import EditorSidebar from './EditorSidebar.svelte';
	import TextStatsPanel from './TextStatsPanel.svelte';
	import type { MarginaliaNote } from '$lib/types';
	
	// Props
	interface Props {
		/** Note ID (optional for new notes) */
		noteId?: string | null;
		/** Initial title */
		initialTitle?: string;
		/** Initial content (Editor.js data) */
		initialContent?: any;
		/** Initial tags */
		initialTags?: string[];
		/** Initial marginalia */
		initialMarginalia?: MarginaliaNote[];
		/** Display mode: 'inline' or 'fullscreen' */
		mode?: 'inline' | 'fullscreen';
		/** Callback when content changes */
		onContentChange?: (data: { title: string; content: any; tags: string[]; marginalia: MarginaliaNote[] }) => void;
		/** Callback when save is requested */
		onSave?: (data: { title: string; content: any; tags: string[]; marginalia: MarginaliaNote[] }) => Promise<void>;
		/** Callback to go fullscreen / expand */
		onExpand?: () => void;
		/** Callback to close/collapse editor */
		onClose?: () => void;
	}
	
	let {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		noteId: _noteId = null,
		initialTitle = '',
		initialContent = null,
		initialTags = [],
		initialMarginalia = [],
		mode = 'inline',
		onContentChange,
		onSave,
		onExpand,
		onClose,
	}: Props = $props();
	
	const i18n = createI18n();
	
	// Editor state
	let editorContainer = $state<HTMLElement | undefined>(undefined);
	let marginaliaColumn = $state<HTMLElement | undefined>(undefined);
	let editor: any = $state(null);
	let title = $state('');
	let titleInitialized = $state(false);
	let saveStatus = $state<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
	let fullWidth = $state(false);
	
	// Initialize title via $effect
	$effect(() => {
		if (!titleInitialized) {
			title = initialTitle || i18n.t('editor.untitled');
			titleInitialized = true;
		}
	});
	
	// Sidebar tab state
	let leftTab = $state<'marginalia' | 'spellcheck'>('marginalia');
	let rightTab = $state<'tags' | 'references' | 'stats'>('tags');
	
	// Text statistics
	let textStats = $state<TextStats>(getEmptyStats());
	
	// Reference Import/Export State
	let showReferenceDialog = $state(false);
	let referenceDialogMode = $state<'import' | 'export'>('import');
	let referenceFormat = $state<'bibtex' | 'csv' | 'excel'>('bibtex');
	let _referenceFileInput = $state<HTMLInputElement | undefined>(undefined);
	let importedReferences = $state<any[]>([]);
	
	// Tab configurations
	const leftTabs = [
		{
			id: 'marginalia',
			icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
			tooltipKey: 'sidebar.marginalia',
		},
		{
			id: 'spellcheck',
			icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
			tooltipKey: 'sidebar.spellcheck',
		},
	];
	
	const rightTabs = [
		{
			id: 'tags',
			icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
			tooltipKey: 'sidebar.tags',
		},
		{
			id: 'references',
			icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
			tooltipKey: 'sidebar.references',
		},
		{
			id: 'stats',
			icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>',
			tooltipKey: 'sidebar.stats',
		},
	];
	
	// Marginalia state (initialize with props, sync via $effect)
	let marginalia = $state<MarginaliaNote[]>([]);
	let marginaliaInitialized = $state(false);
	let editingMarginaliaId = $state<string | null>(null);
	let draggingMarginaliaId = $state<string | null>(null);
	let showContextMenu = $state(false);
	let contextMenuPosition = $state({ x: 0, y: 0 });
	let contextMenuTargetId = $state<string | null>(null);
	
	// Tags state (initialize with props, sync via $effect)
	let tags = $state<string[]>([]);
	let tagsInitialized = $state(false);
	let newTag = $state('');
	
	// Sync initial values once via $effect
	$effect(() => {
		if (!marginaliaInitialized && initialMarginalia) {
			marginalia = [...initialMarginalia];
			marginaliaInitialized = true;
		}
	});
	
	$effect(() => {
		if (!tagsInitialized && initialTags) {
			tags = [...initialTags];
			tagsInitialized = true;
		}
	});
	
	// Toggle full width mode
	function toggleFullWidth() {
		fullWidth = !fullWidth;
	}
	
	// Dictation - Start/Stop speech recognition
	async function toggleDictation() {
		if (aiStore.isRecording) {
			await aiStore.stopDictation();
		} else {
			// Get current language for transcription (first 2 chars)
			const lang = i18n.language.substring(0, 2);
			await aiStore.startDictation(
				(text: string) => {
					// Insert transcribed text into editor
					insertTextAtCursor(text);
				},
				lang
			);
		}
	}
	
	// Insert text at current cursor position in editor
	async function insertTextAtCursor(text: string) {
		if (!editor) return;
		
		try {
			// Get current block index
			const currentIndex = editor.blocks.getCurrentBlockIndex();
			
			if (currentIndex === -1) {
				// No block selected, add new paragraph at end
				await editor.blocks.insert('paragraph', { text });
			} else {
				// Get current block
				const block = editor.blocks.getBlockByIndex(currentIndex);
				if (block) {
					// Get current content and append transcription
					const blockData = await block.save();
					if (blockData && blockData.data) {
						const currentText = blockData.data.text || '';
						const separator = currentText && !currentText.endsWith(' ') ? ' ' : '';
						await editor.blocks.update(block.id, {
							...blockData.data,
							text: currentText + separator + text
						});
					}
				}
			}
			notifyChange();
		} catch (error) {
			console.error('[EditorCore] Failed to insert transcribed text:', error);
		}
	}

	// Add marginalia at click position in column
	function handleMarginaliaColumnClick(e: MouseEvent) {
		if (editingMarginaliaId) return;
		if ((e.target as HTMLElement).closest('.marginalia-note')) return;
		if (!marginaliaColumn || !editorContainer) return;
		
		// Get the editor-main element which is the scroll container
		const editorMain = editorContainer.closest('.editor-main');
		if (!editorMain) return;
		
		const editorMainRect = editorMain.getBoundingClientRect();
		const clickY = e.clientY - editorMainRect.top;
		
		let blockId = 'block-0';
		const blocks = editorContainer.querySelectorAll('.ce-block');
		
		blocks.forEach((block, index) => {
			const blockRect = block.getBoundingClientRect();
			const relativeTop = blockRect.top - editorMainRect.top;
			if (clickY >= relativeTop) {
				const editorBlock = editor?.blocks.getBlockByIndex(index);
				blockId = editorBlock?.id || `block-${index}`;
			}
		});
		
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
		notifyChange();
	}
	
	// Update marginalia content
	function updateMarginaliaContent(id: string, content: string) {
		marginalia = marginalia.map(m =>
			m.id === id ? { ...m, content, updatedAt: new Date() } : m
		);
		notifyChange();
	}
	
	// Delete marginalia
	function deleteMarginalia(id: string) {
		marginalia = marginalia.filter(m => m.id !== id);
		closeContextMenu();
		notifyChange();
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
		if (!draggingMarginaliaId || !editorContainer) return;
		
		const editorMain = editorContainer.closest('.editor-main');
		if (!editorMain) return;
		
		const editorMainRect = editorMain.getBoundingClientRect();
		const newTop = Math.max(0, e.clientY - editorMainRect.top);
		
		marginalia = marginalia.map(m =>
			m.id === draggingMarginaliaId ? { ...m, top: newTop, updatedAt: new Date() } : m
		);
	}
	
	function handleMarginaliaDragEnd() {
		if (draggingMarginaliaId) {
			draggingMarginaliaId = null;
			notifyChange();
		}
	}
	
	// Sync marginalia positions with editor blocks
	async function syncMarginaliaPositions() {
		if (!editor || !editorContainer) return;
		await tick();
		
		const blocks = editorContainer.querySelectorAll('.ce-block');
		const editorBody = editorContainer.closest('.editor-core-body');
		if (!editorBody) return;
		
		// Get the scroll offset of the body - we need positions relative to the scrolling container
		const editorBodyRect = editorBody.getBoundingClientRect();
		const scrollTop = editorBody.scrollTop;
		const positions = new Map<string, number>();
		
		blocks.forEach((block, index) => {
			const blockRect = block.getBoundingClientRect();
			// Calculate position relative to the body's content, accounting for scroll
			const relativeTop = blockRect.top - editorBodyRect.top + scrollTop;
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
	
	// Notify parent of changes
	function notifyChange() {
		saveStatus = 'unsaved';
		onContentChange?.({ title, content: null, tags, marginalia });
	}
	
	// Calculate word count from editor content
	async function updateStats() {
		if (!editor) return;
		
		try {
			const data = await editor.save();
			const text = extractTextFromBlocks(data.blocks || []);
			textStats = analyzeText(text);
		} catch {
			// Ignore errors during word count
		}
	}
	
	// Save handler
	async function save() {
		if (!editor || !onSave) return;
		
		saveStatus = 'saving';
		
		try {
			const content = await editor.save();
			await onSave({ title, content, tags, marginalia });
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
			notifyChange();
		}
	}
	
	function removeTag(tag: string) {
		tags = tags.filter(t => t !== tag);
		notifyChange();
	}
	
	// Reference Import/Export functions
	function openReferenceImport() {
		referenceDialogMode = 'import';
		showReferenceDialog = true;
	}
	
	function openReferenceExport() {
		referenceDialogMode = 'export';
		showReferenceDialog = true;
	}
	
	function closeReferenceDialog() {
		showReferenceDialog = false;
		importedReferences = [];
	}
	
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
	
	async function exportReferences() {
		try {
			const response = await fetch('/api/literature');
			const data = await response.json();
			
			let content = '';
			let filename = 'references';
			let mimeType = 'text/plain';
			
			if (referenceFormat === 'bibtex') {
				const { exportToBibtex } = await import('$lib/services/referenceParser');
				content = exportToBibtex(data);
				filename += '.bib';
				mimeType = 'application/x-bibtex';
			} else if (referenceFormat === 'csv') {
				const { exportToCsv } = await import('$lib/services/referenceParser');
				content = exportToCsv(data);
				filename += '.csv';
				mimeType = 'text/csv';
			}
			
			const blob = new Blob([content], { type: mimeType });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
			
			closeReferenceDialog();
		} catch (err) {
			console.error('Failed to export references:', err);
		}
	}
	
	// Keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key === 's') {
			event.preventDefault();
			save();
		}
		if (event.key === 'Escape') {
			if (showReferenceDialog) {
				closeReferenceDialog();
			} else if (showContextMenu) {
				closeContextMenu();
			}
		}
	}
	
	// Sorted marginalia
	const sortedMarginalia = $derived([...marginalia].sort((a, b) => a.top - b.top));
	
	// Initialize Editor.js
	onMount(() => {
		if (!browser || !editorContainer) return;
		
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
			
			editor = new EditorJS({
				holder: editorContainer!,
				data: initialContent || { blocks: [] },
				placeholder: i18n.t('editor.placeholder'),
				autofocus: mode === 'fullscreen',
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
						config: { placeholder: 'LaTeX (z.B. E = mc^2 oder \\begin{align}...)' },
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
					notifyChange();
					updateStats();
					syncMarginaliaPositions();
				},
				onReady: () => {
					new DragDrop(editor);
					setTimeout(syncMarginaliaPositions, 100);
					updateStats();
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
		
		// Suppress unused warning for bind:this reference
		void _referenceFileInput;
		
		return () => {
			editor?.destroy();
			document.removeEventListener('click', handleClickOutside);
		};
	});
	
	// Export method to get current data
	export function getData() {
		return { title, content: null, tags, marginalia };
	}
	
	// Export method to save
	export async function saveContent() {
		await save();
	}
</script>

<svelte:window 
	onkeydown={handleKeydown}
	onmousemove={handleMarginaliaDrag}
	onmouseup={handleMarginaliaDragEnd}
/>

<div class="editor-core" class:inline-mode={mode === 'inline'} class:fullscreen-mode={mode === 'fullscreen'} class:full-width={fullWidth}>
	<!-- Editor Header -->
	<header class="editor-core-header">
		<!-- Left sidebar tabs -->
		<EditorSidebar 
			side="left" 
			tabs={leftTabs} 
			activeTab={leftTab}
			onTabChange={(id) => leftTab = id as 'marginalia' | 'spellcheck'}
			showTabsOnly={true}
		/>
		
		<!-- Central header area -->
		<div class="header-center">
			<!-- Back button for fullscreen mode -->
			{#if mode === 'fullscreen' && onClose}
				<button 
					type="button" 
					class="header-btn back-btn"
					onclick={onClose}
					title={i18n.t('action.close')}
				>
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="15 18 9 12 15 6" />
					</svg>
				</button>
			{/if}
			
			<input
				type="text"
				class="title-input"
				bind:value={title}
				placeholder={i18n.t('editor.untitled')}
				oninput={() => notifyChange()}
			/>
			
			<div class="header-actions">
				<span class="save-status" class:saved={saveStatus === 'saved'} class:saving={saveStatus === 'saving'} class:error={saveStatus === 'error'}>
					{#if saveStatus === 'saved'}
						✓
					{:else if saveStatus === 'saving'}
						...
					{:else if saveStatus === 'error'}
						!
					{:else}
						●
					{/if}
				</span>
				
				<!-- Dictation button -->
				{#if aiStore.isSupported}
					<button 
						type="button" 
						class="header-btn dictation-btn"
						class:recording={aiStore.isRecording}
						class:processing={aiStore.isProcessing}
						class:loading={aiStore.modelState === 'loading'}
						onclick={toggleDictation}
						disabled={aiStore.modelState === 'loading'}
						title={aiStore.isRecording ? i18n.t('editor.stopDictation') : i18n.t('editor.startDictation')}
						style={aiStore.isRecording ? `--audio-level: ${aiStore.audioLevel}` : ''}
					>
						{#if aiStore.modelState === 'loading'}
							<!-- Loading spinner -->
							<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" class="spin">
								<circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/>
							</svg>
						{:else if aiStore.isRecording}
							<!-- Recording indicator (filled circle) -->
							<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="none">
								<circle cx="12" cy="12" r="6"/>
							</svg>
						{:else if aiStore.isProcessing}
							<!-- Processing dots -->
							<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="none">
								<circle cx="6" cy="12" r="2"/>
								<circle cx="12" cy="12" r="2"/>
								<circle cx="18" cy="12" r="2"/>
							</svg>
						{:else}
							<!-- Microphone icon -->
							<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
								<path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
								<line x1="12" y1="19" x2="12" y2="23"/>
								<line x1="8" y1="23" x2="16" y2="23"/>
							</svg>
						{/if}
					</button>
				{/if}
				
				<!-- Full width toggle -->
				<button 
					type="button" 
					class="header-btn"
					class:active={fullWidth}
					onclick={toggleFullWidth}
					title={fullWidth ? i18n.t('editor.narrowWidth') : i18n.t('editor.fullWidthToggle')}
				>
					{#if fullWidth}
						<!-- Narrow icon (centered lines) -->
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="21" y1="6" x2="3" y2="6"/>
							<line x1="17" y1="12" x2="7" y2="12"/>
							<line x1="21" y1="18" x2="3" y2="18"/>
						</svg>
					{:else}
						<!-- Wide icon (full lines) -->
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="21" y1="6" x2="3" y2="6"/>
							<line x1="21" y1="12" x2="3" y2="12"/>
							<line x1="21" y1="18" x2="3" y2="18"/>
						</svg>
					{/if}
				</button>
				
				<!-- Expand / Fullscreen button (inline mode only) -->
				{#if onExpand && mode === 'inline'}
					<button 
						type="button" 
						class="header-btn"
						onclick={onExpand}
						title={i18n.t('editor.fullscreen')}
					>
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M8 3H5a2 2 0 0 0-2 2v3" />
							<path d="M21 8V5a2 2 0 0 0-2-2h-3" />
							<path d="M3 16v3a2 2 0 0 0 2 2h3" />
							<path d="M16 21h3a2 2 0 0 0 2-2v-3" />
						</svg>
					</button>
				{/if}
				
				<!-- Close button (inline mode) -->
				{#if onClose && mode === 'inline'}
					<button 
						type="button" 
						class="header-btn"
						onclick={onClose}
						title={i18n.t('action.close')}
					>
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18"/>
							<line x1="6" y1="6" x2="18" y2="18"/>
						</svg>
					</button>
				{/if}
				
				<!-- Save button (fullscreen mode) -->
				{#if mode === 'fullscreen' && onSave}
					<button 
						type="button" 
						class="btn btn-primary btn-sm"
						onclick={save}
					>
						{i18n.t('action.save')}
					</button>
				{/if}
			</div>
		</div>
		
		<!-- Right sidebar tabs -->
		<EditorSidebar 
			side="right" 
			tabs={rightTabs} 
			activeTab={rightTab}
			onTabChange={(id) => rightTab = id as 'tags' | 'references' | 'stats'}
			showTabsOnly={true}
		/>
	</header>
	
	<!-- Editor Body -->
	<div class="editor-core-body">
		<!-- Left Sidebar Content -->
		<EditorSidebar 
			side="left" 
			tabs={leftTabs} 
			activeTab={leftTab}
			onTabChange={(id) => leftTab = id as 'marginalia' | 'spellcheck'}
			stickyContent={false}
		>
			{#if leftTab === 'marginalia'}
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
				<div 
					class="marginalia-column"
					bind:this={marginaliaColumn}
					onclick={handleMarginaliaColumnClick}
					onkeypress={() => {}}
					role="region"
					aria-label="Marginalia"
					title={i18n.t('editor.newMarginalia')}
				>
					{#each sortedMarginalia as note (note.id)}
						<div
							class="marginalia-note"
							class:editing={editingMarginaliaId === note.id}
							class:dragging={draggingMarginaliaId === note.id}
							style="top: {note.top}px"
							oncontextmenu={(e) => handleMarginaliaContextMenu(e, note.id)}
							role="listitem"
						>
							<div 
								class="marginalia-drag-handle"
								onmousedown={(e) => handleMarginaliaDragStart(e, note.id)}
								role="separator"
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
					
					{#if marginalia.length === 0}
						<p class="sidebar-empty-hint">{i18n.t('editor.newMarginalia')}</p>
					{/if}
				</div>
			{:else if leftTab === 'spellcheck'}
				<div class="spellcheck-content">
					<p class="sidebar-empty-hint">Rechtschreibprüfung kommt bald.</p>
				</div>
			{/if}
		</EditorSidebar>
		
		<!-- Main Editor Area -->
		<main class="editor-main">
			<div class="editor-container prose" bind:this={editorContainer}></div>
		</main>
		
		<!-- Right Sidebar Content -->
		<EditorSidebar 
			side="right" 
			tabs={rightTabs} 
			activeTab={rightTab}
			onTabChange={(id) => rightTab = id as 'tags' | 'references' | 'stats'}
			stickyContent={rightTab === 'stats'}
		>
			{#if rightTab === 'tags'}
				<div class="tags-content">
					<div class="tags-list">
						{#each tags as tag}
							<span class="tag">
								{tag}
								<button type="button" class="tag-remove" onclick={() => removeTag(tag)}>×</button>
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
			{:else if rightTab === 'references'}
				<div class="references-content">
					<div class="reference-actions">
						<button type="button" class="btn btn-sm btn-ghost" onclick={openReferenceImport}>
							<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
								<polyline points="17 8 12 3 7 8"/>
								<line x1="12" y1="3" x2="12" y2="15"/>
							</svg>
							{i18n.t('references.import')}
						</button>
						<button type="button" class="btn btn-sm btn-ghost" onclick={openReferenceExport}>
							<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
								<polyline points="7 10 12 15 17 10"/>
								<line x1="12" y1="15" x2="12" y2="3"/>
							</svg>
							{i18n.t('references.export')}
						</button>
					</div>
					<p class="sidebar-empty-hint">{i18n.t('references.empty')}</p>
				</div>
			{:else if rightTab === 'stats'}
				<TextStatsPanel stats={textStats} />
			{/if}
		</EditorSidebar>
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
</div>

<style>
	.editor-core {
		display: flex;
		flex-direction: column;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
	
	/* Inline mode sizing */
	.editor-core.inline-mode {
		min-height: 300px;
		max-height: 70vh;
	}
	
	/* Fullscreen mode sizing */
	.editor-core.fullscreen-mode {
		height: 100%;
		border: none;
		border-radius: 0;
	}
	
	/* Dark mode */
	:global(html.dark) .editor-core {
		background: #000;
	}
	
	/* Header */
	.editor-core-header {
		display: grid;
		grid-template-columns: var(--margin-column-width) 1fr var(--tag-column-width);
		position: sticky;
		top: 0;
		z-index: 10;
		background: var(--color-bg-sunken);
		border-bottom: 1px solid var(--color-border-subtle);
	}
	
	.header-center {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-4);
		background: var(--color-bg);
		border-left: 1px solid var(--color-border-subtle);
		border-right: 1px solid var(--color-border-subtle);
	}
	
	:global(html.dark) .header-center {
		background: #000;
	}
	
	.title-input {
		flex: 1;
		min-width: 0;
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
		min-width: 1em;
		text-align: center;
	}
	
	.save-status.saved { color: var(--color-success); }
	.save-status.saving { color: var(--color-warning); }
	.save-status.error { color: var(--color-error); }
	
	.header-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		background: transparent;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}
	
	.header-btn:hover {
		color: var(--color-text);
		background: var(--color-bg-hover);
	}
	
	.header-btn.active {
		color: var(--color-active);
	}
	
	/* Dictation button styles */
	.dictation-btn.recording {
		color: var(--color-error);
		animation: pulse-recording 1.5s ease-in-out infinite;
	}
	
	.dictation-btn.processing {
		color: var(--color-warning);
	}
	
	.dictation-btn.loading {
		color: var(--color-text-muted);
		cursor: wait;
	}
	
	.dictation-btn .spin {
		animation: spin 1s linear infinite;
	}
	
	@keyframes pulse-recording {
		0%, 100% { 
			opacity: 1;
			transform: scale(1);
		}
		50% { 
			opacity: 0.6;
			transform: scale(1.1);
		}
	}
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* Body */
	.editor-core-body {
		display: grid;
		grid-template-columns: var(--margin-column-width) 1fr var(--tag-column-width);
		flex: 1;
		overflow-y: auto;  /* Entire body scrolls together */
		overflow-x: hidden;
	}
	
	/* Main editor area */
	.editor-main {
		padding: var(--space-6) var(--space-8);
		display: flex;
		justify-content: center;
		background: var(--color-bg-elevated);
		min-height: 100%;
	}
	
	:global(html.dark) .editor-main {
		background: #000;
	}
	
	.editor-container {
		width: 100%;
		min-height: 100%;
	}
	
	/* Width toggle */
	.editor-core:not(.full-width) .editor-container {
		max-width: var(--content-max-width);
	}
	
	/* Editor.js overrides */
	.editor-container :global(.ce-block__content) {
		max-width: 100%;
	}
	
	.editor-container :global(.ce-toolbar__content) {
		max-width: 100%;
	}
	
	.editor-container :global(.codex-editor__redactor) {
		padding-bottom: 100px;
	}
	
	/* Marginalia column */
	.marginalia-column {
		position: relative;
		min-height: 200px;
		cursor: crosshair;
	}
	
	.marginalia-note {
		position: absolute;
		left: var(--space-2);
		right: var(--space-2);
		display: flex;
		gap: var(--space-1);
		transition: box-shadow var(--transition-fast);
	}
	
	.marginalia-note:hover,
	.marginalia-note.editing {
		box-shadow: var(--shadow-sm);
	}
	
	.marginalia-note.dragging {
		opacity: 0.7;
	}
	
	.marginalia-drag-handle {
		width: 3px;
		min-height: 24px;
		background: transparent;
		cursor: grab;
		flex-shrink: 0;
		transition: background var(--transition-fast);
		border-radius: 2px;
	}
	
	.marginalia-note:hover .marginalia-drag-handle,
	.marginalia-note.editing .marginalia-drag-handle,
	.marginalia-note.dragging .marginalia-drag-handle {
		background: var(--color-active);
	}
	
	.marginalia-note.dragging .marginalia-drag-handle {
		cursor: grabbing;
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
	
	/* Sidebar content */
	.spellcheck-content,
	.tags-content,
	.references-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	
	.reference-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: 0 var(--space-2);
	}
	
	.reference-actions .btn {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		justify-content: flex-start;
	}
	
	.sidebar-empty-hint {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-align: center;
		padding: var(--space-4);
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
	
	/* Context menu */
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
	
	/* Mobile */
	@media (max-width: 1024px) {
		.editor-core-header {
			grid-template-columns: auto 1fr auto;
		}
		
		.editor-core-body {
			grid-template-columns: 1fr;
		}
		
		.editor-core-body :global(.editor-sidebar) {
			display: none;
		}
	}
</style>
