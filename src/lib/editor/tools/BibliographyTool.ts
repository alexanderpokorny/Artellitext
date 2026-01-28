/**
 * Bibliography Block Tool for Editor.js
 * 
 * Auto-generates a bibliography from all citations in the document.
 * Updates dynamically when citations change.
 */

// @ts-expect-error citation-js has no types
import Cite from 'citation-js';

interface BibliographyData {
	style: string;
	title?: string;
	citations?: CitationEntry[];
}

interface CitationEntry {
	key: string;
	cslJson: Record<string, unknown>;
}

interface BibliographyConfig {
	defaultStyle?: string;
	availableStyles?: string[];
	defaultTitle?: string;
}

interface API {
	styles: {
		block: string;
		settingsButton: string;
		settingsButtonActive: string;
	};
	blocks: {
		getBlockByIndex: (index: number) => { name: string; save: () => Promise<{ key: string; cslJson: Record<string, unknown> }> } | undefined;
		getBlocksCount: () => number;
	};
}

const DEFAULT_STYLES = ['apa', 'ieee', 'chicago-author-date', 'harvard1', 'vancouver'];
const STYLE_NAMES: Record<string, string> = {
	'apa': 'APA 7th Edition',
	'ieee': 'IEEE',
	'chicago-author-date': 'Chicago (Author-Date)',
	'harvard1': 'Harvard',
	'vancouver': 'Vancouver',
};

export default class BibliographyTool {
	private data: BibliographyData;
	private wrapper: HTMLElement | null = null;
	private contentEl: HTMLElement | null = null;
	private api: API;
	private config: BibliographyConfig;
	private readOnly: boolean;

	static get toolbox() {
		return {
			title: 'Bibliography',
			icon: '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/></svg>',
		};
	}

	static get isReadOnlySupported() {
		return true;
	}

	static get enableLineBreaks() {
		return false;
	}

	constructor({ data, api, config, readOnly }: { data: BibliographyData; api: API; config: BibliographyConfig; readOnly: boolean }) {
		this.data = {
			style: data.style || config.defaultStyle || 'apa',
			title: data.title || config.defaultTitle || 'References',
			citations: data.citations || [],
		};
		this.api = api;
		this.config = {
			defaultStyle: config.defaultStyle || 'apa',
			availableStyles: config.availableStyles || DEFAULT_STYLES,
			defaultTitle: config.defaultTitle || 'References',
		};
		this.readOnly = readOnly;
	}

	render(): HTMLElement {
		this.wrapper = document.createElement('div');
		this.wrapper.classList.add('bibliography-block');

		// Title
		const titleContainer = document.createElement('div');
		titleContainer.classList.add('bibliography-header');

		if (this.readOnly) {
			const title = document.createElement('h2');
			title.classList.add('bibliography-title');
			title.textContent = this.data.title || 'References';
			titleContainer.appendChild(title);
		} else {
			const titleInput = document.createElement('input');
			titleInput.type = 'text';
			titleInput.classList.add('bibliography-title-input');
			titleInput.value = this.data.title || 'References';
			titleInput.placeholder = 'Bibliography Title';
			titleInput.addEventListener('input', () => {
				this.data.title = titleInput.value;
			});
			titleContainer.appendChild(titleInput);

			// Style selector
			const styleContainer = document.createElement('div');
			styleContainer.classList.add('bibliography-style-container');

			const styleLabel = document.createElement('span');
			styleLabel.textContent = 'Style:';
			styleContainer.appendChild(styleLabel);

			const styleSelect = document.createElement('select');
			styleSelect.classList.add('bibliography-style-select');
			this.config.availableStyles?.forEach(style => {
				const option = document.createElement('option');
				option.value = style;
				option.textContent = STYLE_NAMES[style] || style.toUpperCase();
				option.selected = style === this.data.style;
				styleSelect.appendChild(option);
			});
			styleSelect.addEventListener('change', () => {
				this.data.style = styleSelect.value;
				this.regenerateBibliography();
			});
			styleContainer.appendChild(styleSelect);

			// Refresh button
			const refreshBtn = document.createElement('button');
			refreshBtn.type = 'button';
			refreshBtn.classList.add('bibliography-refresh-btn');
			refreshBtn.innerHTML = '↻ Refresh';
			refreshBtn.title = 'Regenerate bibliography from document citations';
			refreshBtn.addEventListener('click', () => this.collectAndRender());
			styleContainer.appendChild(refreshBtn);

			titleContainer.appendChild(styleContainer);
		}

		this.wrapper.appendChild(titleContainer);

		// Content area
		this.contentEl = document.createElement('div');
		this.contentEl.classList.add('bibliography-content');
		this.wrapper.appendChild(this.contentEl);

		// Initial render
		if (this.data.citations && this.data.citations.length > 0) {
			this.regenerateBibliography();
		} else {
			this.collectAndRender();
		}

		return this.wrapper;
	}

	/**
	 * Collect all citations from the document
	 */
	private async collectAndRender(): Promise<void> {
		const citations: CitationEntry[] = [];
		const blocksCount = this.api.blocks.getBlocksCount();

		for (let i = 0; i < blocksCount; i++) {
			const block = this.api.blocks.getBlockByIndex(i);
			if (block && block.name === 'citation') {
				try {
					const data = await block.save();
					if (data && data.key && data.cslJson) {
						citations.push({
							key: data.key,
							cslJson: data.cslJson,
						});
					}
				} catch (e) {
					console.warn('Could not get citation data from block', i, e);
				}
			}
		}

		this.data.citations = citations;
		this.regenerateBibliography();
	}

	/**
	 * Regenerate the bibliography HTML
	 */
	private regenerateBibliography(): void {
		if (!this.contentEl) return;

		const citations = this.data.citations || [];

		if (citations.length === 0) {
			this.contentEl.innerHTML = `
				<div class="bibliography-empty">
					<p>No citations found in document.</p>
					<p class="bibliography-hint">Add citations using the Citation block, then click "Refresh" to generate the bibliography.</p>
				</div>
			`;
			return;
		}

		try {
			// Extract CSL-JSON data
			const cslData = citations.map(c => c.cslJson).filter(Boolean);
			
			// Sort by author/year
			const cite = new Cite(cslData);
			
			// Generate bibliography HTML
			const bibliographyHtml = cite.format('bibliography', {
				format: 'html',
				template: this.data.style,
				lang: 'en-US',
			});

			this.contentEl.innerHTML = bibliographyHtml;

			// Add entry class to each item
			const entries = this.contentEl.querySelectorAll('.csl-entry');
			entries.forEach((entry, index) => {
				entry.classList.add('bibliography-entry');
				// Add citation key as data attribute
				if (citations[index]) {
					(entry as HTMLElement).dataset.citationKey = citations[index].key;
				}
			});
		} catch (error) {
			console.error('Bibliography generation error:', error);
			this.contentEl.innerHTML = `
				<div class="bibliography-error">
					<p>Error generating bibliography.</p>
					<p class="bibliography-hint">${error instanceof Error ? error.message : 'Unknown error'}</p>
				</div>
			`;
		}
	}

	save(): BibliographyData {
		return {
			style: this.data.style,
			title: this.data.title,
			citations: this.data.citations,
		};
	}

	static get sanitize() {
		return {
			title: true,
			style: true,
		};
	}
}
