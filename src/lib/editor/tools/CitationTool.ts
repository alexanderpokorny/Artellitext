/**
 * Citation Block Tool for Editor.js
 * 
 * Manages academic citations with BibTeX and CSL-JSON support.
 * Uses Citation.js for parsing and formatting.
 */

// @ts-expect-error citation-js has no types
import Cite from 'citation-js';

interface CitationData {
	cslJson: Record<string, unknown>;
	key: string;
	formattedText?: string;
	style?: string;
}

interface CitationConfig {
	defaultStyle?: string;
	availableStyles?: string[];
}

interface API {
	styles: {
		block: string;
		settingsButton: string;
		settingsButtonActive: string;
	};
}

const DEFAULT_STYLES = ['apa', 'ieee', 'chicago-author-date', 'harvard1', 'vancouver'];

export default class CitationTool {
	private data: CitationData;
	private wrapper: HTMLElement | null = null;
	private config: CitationConfig;
	private readOnly: boolean;

	static get toolbox() {
		return {
			title: 'Citation',
			icon: '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z" fill="currentColor"/></svg>',
		};
	}

	static get isReadOnlySupported() {
		return true;
	}

	static get enableLineBreaks() {
		return false;
	}

	constructor({ data, config, readOnly }: { data: CitationData; api?: API; config: CitationConfig; readOnly: boolean }) {
		this.data = {
			cslJson: data.cslJson || {},
			key: data.key || '',
			formattedText: data.formattedText || '',
			style: data.style || config.defaultStyle || 'apa',
		};
		this.config = {
			defaultStyle: config.defaultStyle || 'apa',
			availableStyles: config.availableStyles || DEFAULT_STYLES,
		};
		this.readOnly = readOnly;
	}

	render(): HTMLElement {
		this.wrapper = document.createElement('div');
		this.wrapper.classList.add('citation-block');

		if (this.readOnly) {
			this.renderReadOnly();
		} else {
			this.renderEditable();
		}

		return this.wrapper;
	}

	private renderReadOnly(): void {
		if (!this.wrapper) return;

		const citation = document.createElement('span');
		citation.classList.add('citation-inline');
		citation.textContent = this.data.formattedText || `[${this.data.key}]`;
		this.wrapper.appendChild(citation);
	}

	private renderEditable(): void {
		if (!this.wrapper) return;

		// Citation display
		const display = document.createElement('div');
		display.classList.add('citation-display');

		if (this.data.key) {
			display.innerHTML = `<span class="citation-key">[${this.data.key}]</span>`;
		} else {
			display.innerHTML = '<span class="citation-placeholder">Click to add citation</span>';
		}

		this.wrapper.appendChild(display);

		// Input area (hidden by default)
		const inputArea = document.createElement('div');
		inputArea.classList.add('citation-input-area');
		inputArea.style.display = 'none';

		// BibTeX input
		const bibtexLabel = document.createElement('label');
		bibtexLabel.textContent = 'Paste BibTeX or DOI:';
		inputArea.appendChild(bibtexLabel);

		const bibtexInput = document.createElement('textarea');
		bibtexInput.classList.add('citation-bibtex-input');
		bibtexInput.placeholder = `@article{key,
  author = {Author Name},
  title = {Article Title},
  journal = {Journal Name},
  year = {2024}
}

or paste a DOI like: 10.1000/xyz123`;
		bibtexInput.rows = 6;
		inputArea.appendChild(bibtexInput);

		// Style selector
		const styleContainer = document.createElement('div');
		styleContainer.classList.add('citation-style-container');

		const styleLabel = document.createElement('label');
		styleLabel.textContent = 'Citation Style:';
		styleContainer.appendChild(styleLabel);

		const styleSelect = document.createElement('select');
		styleSelect.classList.add('citation-style-select');
		this.config.availableStyles?.forEach(style => {
			const option = document.createElement('option');
			option.value = style;
			option.textContent = style.toUpperCase();
			option.selected = style === this.data.style;
			styleSelect.appendChild(option);
		});
		styleContainer.appendChild(styleSelect);
		inputArea.appendChild(styleContainer);

		// Parse button
		const parseBtn = document.createElement('button');
		parseBtn.type = 'button';
		parseBtn.classList.add('citation-parse-btn');
		parseBtn.textContent = 'Parse Citation';
		parseBtn.addEventListener('click', async () => {
			await this.parseCitation(bibtexInput.value, styleSelect.value);
			inputArea.style.display = 'none';
			this.updateDisplay(display);
		});
		inputArea.appendChild(parseBtn);

		this.wrapper.appendChild(inputArea);

		// Toggle input on click
		display.addEventListener('click', () => {
			inputArea.style.display = inputArea.style.display === 'none' ? 'block' : 'none';
		});
	}

	private async parseCitation(input: string, style: string): Promise<void> {
		if (!input.trim()) return;

		try {
			const cite = new Cite(input);
			const cslJson = cite.get({ format: 'real', type: 'json' })[0];

			if (cslJson) {
				this.data.cslJson = cslJson;
				this.data.key = cslJson.id || this.generateKey(cslJson);
				this.data.style = style;

				// Format the citation
				const formatted = cite.format('citation', {
					format: 'text',
					template: style,
					lang: 'en-US',
				});
				this.data.formattedText = formatted;
			}
		} catch (error) {
			console.error('Citation parsing error:', error);
			// Try as DOI
			if (input.match(/^10\.\d{4,}/)) {
				try {
					const cite = new Cite(`https://doi.org/${input}`);
					await cite.async();
					const cslJson = cite.get({ format: 'real', type: 'json' })[0];

					if (cslJson) {
						this.data.cslJson = cslJson;
						this.data.key = cslJson.id || this.generateKey(cslJson);
						this.data.style = style;

						const formatted = cite.format('citation', {
							format: 'text',
							template: style,
							lang: 'en-US',
						});
						this.data.formattedText = formatted;
					}
				} catch (doiError) {
					console.error('DOI fetch error:', doiError);
				}
			}
		}
	}

	private generateKey(cslJson: Record<string, unknown>): string {
		const author = (cslJson.author as Array<{ family?: string }>)?.[0]?.family || 'Unknown';
		const issued = cslJson.issued as { 'date-parts'?: number[][] } | undefined;
		const year = issued?.['date-parts']?.[0]?.[0] || new Date().getFullYear();
		return `${author}${year}`.toLowerCase().replace(/\s+/g, '');
	}

	private updateDisplay(display: HTMLElement): void {
		if (this.data.key) {
			display.innerHTML = `
				<span class="citation-key">[${this.data.key}]</span>
				<span class="citation-preview">${this.data.formattedText || ''}</span>
			`;
		} else {
			display.innerHTML = '<span class="citation-placeholder">Click to add citation</span>';
		}
	}

	save(): CitationData {
		return {
			cslJson: this.data.cslJson,
			key: this.data.key,
			formattedText: this.data.formattedText,
			style: this.data.style,
		};
	}

	static get sanitize() {
		return {
			key: true,
			formattedText: true,
		};
	}

	/**
	 * Static method to generate a bibliography from all citations
	 */
	static generateBibliography(citations: CitationData[], style: string = 'apa'): string {
		try {
			const cslData = citations.map(c => c.cslJson).filter(Boolean);
			if (cslData.length === 0) return '';

			const cite = new Cite(cslData);
			return cite.format('bibliography', {
				format: 'html',
				template: style,
				lang: 'en-US',
			});
		} catch (error) {
			console.error('Bibliography generation error:', error);
			return '';
		}
	}
}
