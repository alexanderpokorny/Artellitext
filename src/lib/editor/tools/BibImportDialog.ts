/**
 * BibTeX Import Dialog Component
 * 
 * Modal dialog for importing .bib files or pasting BibTeX content.
 * Parses and adds citations to the literature database.
 */

// @ts-expect-error citation-js has no types
import Cite from 'citation-js';

export interface ParsedCitation {
	key: string;
	cslJson: Record<string, unknown>;
	bibtex: string;
	title: string;
	authors: string[];
	year: number | null;
	type: string;
}

export interface BibImportResult {
	success: ParsedCitation[];
	errors: Array<{ input: string; error: string }>;
}

/**
 * Parse BibTeX content and return structured citation data
 */
export async function parseBibTeX(content: string): Promise<BibImportResult> {
	const result: BibImportResult = {
		success: [],
		errors: [],
	};

	if (!content.trim()) {
		return result;
	}

	try {
		const cite = new Cite(content);
		const entries = cite.get({ format: 'real', type: 'json' }) as Record<string, unknown>[];

		for (const entry of entries) {
			try {
				const authors = extractAuthors(entry);
				const year = extractYear(entry);
				
				result.success.push({
					key: (entry.id as string) || generateKey(entry),
					cslJson: entry,
					bibtex: new Cite(entry).format('bibtex'),
					title: (entry.title as string) || 'Untitled',
					authors,
					year,
					type: (entry.type as string) || 'article',
				});
			} catch (entryError) {
				result.errors.push({
					input: JSON.stringify(entry).substring(0, 100),
					error: entryError instanceof Error ? entryError.message : 'Unknown error',
				});
			}
		}
	} catch (parseError) {
		result.errors.push({
			input: content.substring(0, 100),
			error: parseError instanceof Error ? parseError.message : 'Failed to parse BibTeX',
		});
	}

	return result;
}

/**
 * Extract author names from CSL-JSON entry
 */
function extractAuthors(entry: Record<string, unknown>): string[] {
	const authors = entry.author as Array<{ family?: string; given?: string }> | undefined;
	if (!authors || !Array.isArray(authors)) return [];
	
	return authors.map(a => {
		if (a.family && a.given) {
			return `${a.family}, ${a.given}`;
		}
		return a.family || a.given || 'Unknown';
	});
}

/**
 * Extract year from CSL-JSON entry
 */
function extractYear(entry: Record<string, unknown>): number | null {
	const issued = entry.issued as { 'date-parts'?: number[][] } | undefined;
	if (issued?.['date-parts']?.[0]?.[0]) {
		return issued['date-parts'][0][0];
	}
	return null;
}

/**
 * Generate a citation key from entry data
 */
function generateKey(entry: Record<string, unknown>): string {
	const authors = entry.author as Array<{ family?: string }> | undefined;
	const firstAuthor = authors?.[0]?.family || 'Unknown';
	const year = extractYear(entry) || new Date().getFullYear();
	return `${firstAuthor}${year}`.toLowerCase().replace(/\s+/g, '');
}

/**
 * Create the BibTeX import dialog
 */
export function createBibImportDialog(
	onImport: (citations: ParsedCitation[]) => void,
	onClose: () => void
): HTMLElement {
	const overlay = document.createElement('div');
	overlay.classList.add('bib-import-overlay');

	const dialog = document.createElement('div');
	dialog.classList.add('bib-import-dialog');
	dialog.setAttribute('role', 'dialog');
	dialog.setAttribute('aria-modal', 'true');
	dialog.setAttribute('aria-labelledby', 'bib-import-title');

	dialog.innerHTML = `
		<div class="bib-import-header">
			<h2 id="bib-import-title">Import BibTeX</h2>
			<button type="button" class="bib-import-close" aria-label="Close">×</button>
		</div>
		
		<div class="bib-import-body">
			<div class="bib-import-tabs">
				<button type="button" class="bib-import-tab active" data-tab="paste">Paste BibTeX</button>
				<button type="button" class="bib-import-tab" data-tab="file">Upload .bib File</button>
				<button type="button" class="bib-import-tab" data-tab="doi">Fetch by DOI</button>
			</div>
			
			<div class="bib-import-content">
				<!-- Paste Tab -->
				<div class="bib-import-panel active" data-panel="paste">
					<textarea 
						class="bib-import-textarea" 
						placeholder="Paste BibTeX entries here...

@article{example2024,
  author = {Smith, John and Doe, Jane},
  title = {An Example Article},
  journal = {Journal of Examples},
  year = {2024},
  volume = {1},
  pages = {1-10}
}"
						rows="12"
					></textarea>
				</div>
				
				<!-- File Tab -->
				<div class="bib-import-panel" data-panel="file">
					<div class="bib-import-dropzone">
						<input type="file" accept=".bib,.bibtex,text/plain" class="bib-import-file-input" />
						<div class="bib-import-dropzone-content">
							<span class="bib-import-dropzone-icon">📄</span>
							<p>Drop .bib file here or click to browse</p>
						</div>
					</div>
					<div class="bib-import-file-info"></div>
				</div>
				
				<!-- DOI Tab -->
				<div class="bib-import-panel" data-panel="doi">
					<input 
						type="text" 
						class="bib-import-doi-input" 
						placeholder="Enter DOI (e.g., 10.1000/xyz123)"
					/>
					<p class="bib-import-hint">Enter a DOI to automatically fetch citation metadata.</p>
				</div>
			</div>
			
			<!-- Preview -->
			<div class="bib-import-preview">
				<h3>Preview <span class="bib-import-count"></span></h3>
				<div class="bib-import-preview-list"></div>
			</div>
			
			<!-- Errors -->
			<div class="bib-import-errors" style="display: none;">
				<h3>Errors</h3>
				<div class="bib-import-errors-list"></div>
			</div>
		</div>
		
		<div class="bib-import-footer">
			<button type="button" class="bib-import-btn bib-import-btn-secondary bib-import-cancel">Cancel</button>
			<button type="button" class="bib-import-btn bib-import-btn-primary bib-import-submit" disabled>Import Citations</button>
		</div>
	`;

	overlay.appendChild(dialog);

	// State
	let parsedCitations: ParsedCitation[] = [];
	let parseErrors: Array<{ input: string; error: string }> = [];

	// Elements
	const closeBtn = dialog.querySelector('.bib-import-close') as HTMLButtonElement;
	const cancelBtn = dialog.querySelector('.bib-import-cancel') as HTMLButtonElement;
	const submitBtn = dialog.querySelector('.bib-import-submit') as HTMLButtonElement;
	const tabs = dialog.querySelectorAll('.bib-import-tab');
	const panels = dialog.querySelectorAll('.bib-import-panel');
	const textarea = dialog.querySelector('.bib-import-textarea') as HTMLTextAreaElement;
	const fileInput = dialog.querySelector('.bib-import-file-input') as HTMLInputElement;
	const dropzone = dialog.querySelector('.bib-import-dropzone') as HTMLElement;
	const fileInfo = dialog.querySelector('.bib-import-file-info') as HTMLElement;
	const doiInput = dialog.querySelector('.bib-import-doi-input') as HTMLInputElement;
	const previewList = dialog.querySelector('.bib-import-preview-list') as HTMLElement;
	const previewCount = dialog.querySelector('.bib-import-count') as HTMLElement;
	const errorsContainer = dialog.querySelector('.bib-import-errors') as HTMLElement;
	const errorsList = dialog.querySelector('.bib-import-errors-list') as HTMLElement;

	// Tab switching
	tabs.forEach(tab => {
		tab.addEventListener('click', () => {
			tabs.forEach(t => t.classList.remove('active'));
			panels.forEach(p => p.classList.remove('active'));
			tab.classList.add('active');
			const panelName = (tab as HTMLElement).dataset.tab;
			dialog.querySelector(`[data-panel="${panelName}"]`)?.classList.add('active');
		});
	});

	// Update preview
	function updatePreview() {
		if (parsedCitations.length === 0) {
			previewList.innerHTML = '<p class="bib-import-empty">No citations parsed yet.</p>';
			previewCount.textContent = '';
			submitBtn.disabled = true;
		} else {
			previewCount.textContent = `(${parsedCitations.length})`;
			previewList.innerHTML = parsedCitations.map(c => `
				<div class="bib-import-preview-item">
					<span class="bib-import-preview-key">[${c.key}]</span>
					<span class="bib-import-preview-title">${c.title}</span>
					<span class="bib-import-preview-authors">${c.authors.join(', ') || 'Unknown'}</span>
					<span class="bib-import-preview-year">${c.year || 'n.d.'}</span>
				</div>
			`).join('');
			submitBtn.disabled = false;
		}

		// Show errors
		if (parseErrors.length > 0) {
			errorsContainer.style.display = 'block';
			errorsList.innerHTML = parseErrors.map(e => `
				<div class="bib-import-error-item">
					<span class="bib-import-error-msg">${e.error}</span>
				</div>
			`).join('');
		} else {
			errorsContainer.style.display = 'none';
		}
	}

	// Parse textarea content
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	textarea.addEventListener('input', () => {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(async () => {
			const result = await parseBibTeX(textarea.value);
			parsedCitations = result.success;
			parseErrors = result.errors;
			updatePreview();
		}, 500);
	});

	// File handling
	fileInput.addEventListener('change', async () => {
		const file = fileInput.files?.[0];
		if (file) {
			const content = await file.text();
			fileInfo.textContent = `Loaded: ${file.name}`;
			const result = await parseBibTeX(content);
			parsedCitations = result.success;
			parseErrors = result.errors;
			updatePreview();
		}
	});

	// Drag and drop
	dropzone.addEventListener('dragover', (e) => {
		e.preventDefault();
		dropzone.classList.add('dragover');
	});
	dropzone.addEventListener('dragleave', () => {
		dropzone.classList.remove('dragover');
	});
	dropzone.addEventListener('drop', async (e) => {
		e.preventDefault();
		dropzone.classList.remove('dragover');
		const file = e.dataTransfer?.files[0];
		if (file) {
			const content = await file.text();
			fileInfo.textContent = `Loaded: ${file.name}`;
			const result = await parseBibTeX(content);
			parsedCitations = result.success;
			parseErrors = result.errors;
			updatePreview();
		}
	});

	// DOI fetch
	doiInput.addEventListener('keypress', async (e) => {
		if (e.key === 'Enter') {
			const doi = doiInput.value.trim();
			if (doi) {
				try {
					const cite = new Cite(`https://doi.org/${doi}`);
					await cite.async();
					const result = await parseBibTeX(cite.format('bibtex'));
					parsedCitations = result.success;
					parseErrors = result.errors;
					updatePreview();
				} catch (err) {
					parseErrors = [{ input: doi, error: 'Could not fetch DOI' }];
					updatePreview();
				}
			}
		}
	});

	// Close handlers
	function close() {
		overlay.remove();
		onClose();
	}

	closeBtn.addEventListener('click', close);
	cancelBtn.addEventListener('click', close);
	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) close();
	});

	// Submit handler
	submitBtn.addEventListener('click', () => {
		if (parsedCitations.length > 0) {
			onImport(parsedCitations);
			close();
		}
	});

	// Keyboard handling
	dialog.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') close();
	});

	// Focus trap
	setTimeout(() => textarea.focus(), 100);

	return overlay;
}

/**
 * Show the BibTeX import dialog
 */
export function showBibImportDialog(
	onImport: (citations: ParsedCitation[]) => void
): void {
	const dialog = createBibImportDialog(onImport, () => {});
	document.body.appendChild(dialog);
}
