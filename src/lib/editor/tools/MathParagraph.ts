/**
 * MathParagraph - Custom Paragraph with automatic math rendering
 * 
 * Automatically renders $...$ and $$...$$ syntax in paragraphs.
 * Extends the default paragraph behavior.
 */

import katex from 'katex';

interface ParagraphData {
	text: string;
}

interface API {
	styles: {
		block: string;
	};
	sanitizer: unknown;
}

interface ParagraphConfig {
	placeholder?: string;
	preserveBlank?: boolean;
}

export default class MathParagraph {
	private data: ParagraphData;
	private wrapper: HTMLElement | null = null;
	private api: API;
	private config: ParagraphConfig;
	private readOnly: boolean;
	private isEditing = false;
	private contentEditable: HTMLElement | null = null;

	static get toolbox() {
		return {
			title: 'Text',
			icon: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="15" viewBox="0 0 17 15"><path d="M7.5 0h9a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-3.5v12.5a.5.5 0 0 1-1 0V1h-4v12.5a.5.5 0 0 1-1 0V1H3v2.5a.5.5 0 0 1-1 0v-3A.5.5 0 0 1 2.5 0h5z"/></svg>',
		};
	}

	static get isReadOnlySupported() {
		return true;
	}

	static get enableLineBreaks() {
		return true;
	}

	static get pasteConfig() {
		return {
			tags: ['P'],
		};
	}

	static get sanitize() {
		return {
			text: {
				br: true,
				span: {
					class: true,
					'data-latex': true,
				},
				div: {
					class: true,
					'data-latex': true,
				},
			},
		};
	}

	static get conversionConfig() {
		return {
			export: 'text',
			import: 'text',
		};
	}

	constructor({ data, api, config, readOnly }: { data: ParagraphData; api: API; config: ParagraphConfig; readOnly: boolean }) {
		this.data = {
			text: data.text || '',
		};
		this.api = api;
		this.config = config || {};
		this.readOnly = readOnly;
	}

	render(): HTMLElement {
		this.wrapper = document.createElement('div');
		this.wrapper.classList.add('ce-paragraph', 'cdx-block', this.api.styles.block);

		this.contentEditable = document.createElement('p');
		this.contentEditable.classList.add('ce-paragraph__content');
		
		if (!this.readOnly) {
			this.contentEditable.contentEditable = 'true';
			this.contentEditable.dataset.placeholder = this.config.placeholder || '';
			
			// On focus, show raw text for editing
			this.contentEditable.addEventListener('focus', () => {
				this.isEditing = true;
				// Show raw text
				this.contentEditable!.innerHTML = this.escapeHtml(this.data.text);
			});
			
			// On blur, render math
			this.contentEditable.addEventListener('blur', () => {
				this.isEditing = false;
				this.data.text = this.contentEditable!.innerText;
				this.renderContent();
			});
			
			// Save on input
			this.contentEditable.addEventListener('input', () => {
				if (this.isEditing) {
					this.data.text = this.contentEditable!.innerText;
				}
			});
			
			// Handle paste - get plain text
			this.contentEditable.addEventListener('paste', (e) => {
				e.preventDefault();
				const text = e.clipboardData?.getData('text/plain') || '';
				document.execCommand('insertText', false, text);
			});
		}

		this.wrapper.appendChild(this.contentEditable);
		this.renderContent();

		return this.wrapper;
	}

	private renderContent(): void {
		if (!this.contentEditable) return;
		
		if (this.isEditing || this.readOnly && !this.data.text.includes('$')) {
			// Show raw text when editing
			this.contentEditable.innerHTML = this.escapeHtml(this.data.text) || '<br>';
		} else {
			// Render math when not editing
			this.contentEditable.innerHTML = this.processMath(this.data.text) || '<br>';
		}
	}

	/**
	 * Process $...$ and $$...$$ patterns
	 */
	private processMath(text: string): string {
		if (!text) return '';
		
		let result = this.escapeHtml(text);

		// Process display math first ($$...$$)
		result = result.replace(/\$\$([^$]+)\$\$/g, (_, latex) => {
			try {
				const html = katex.renderToString(latex.trim(), {
					displayMode: true,
					throwOnError: false,
					errorColor: '#cc0000',
					trust: false,
					strict: false,
					macros: {
						'\\R': '\\mathbb{R}',
						'\\N': '\\mathbb{N}',
						'\\Z': '\\mathbb{Z}',
						'\\Q': '\\mathbb{Q}',
						'\\C': '\\mathbb{C}',
					},
				});
				return `<div class="math-display" data-latex="${this.escapeAttr(latex.trim())}">${html}</div>`;
			} catch {
				return `$$${latex}$$`;
			}
		});

		// Process inline math ($...$) - avoid matching $$
		result = result.replace(/(?<!\$)\$([^$\n]+)\$(?!\$)/g, (_, latex) => {
			try {
				const html = katex.renderToString(latex.trim(), {
					displayMode: false,
					throwOnError: false,
					errorColor: '#cc0000',
					trust: false,
					strict: false,
					macros: {
						'\\R': '\\mathbb{R}',
						'\\N': '\\mathbb{N}',
						'\\Z': '\\mathbb{Z}',
						'\\Q': '\\mathbb{Q}',
						'\\C': '\\mathbb{C}',
					},
				});
				return `<span class="math-inline" data-latex="${this.escapeAttr(latex.trim())}">${html}</span>`;
			} catch {
				return `$${latex}$`;
			}
		});

		return result;
	}

	private escapeHtml(text: string): string {
		const map: Record<string, string> = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
		};
		return text.replace(/[&<>]/g, char => map[char]);
	}

	private escapeAttr(text: string): string {
		return text.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
	}

	save(): ParagraphData {
		return {
			text: this.data.text,
		};
	}

	onPaste(event: { detail: { data: HTMLElement } }) {
		const { data } = event.detail;
		this.data.text = data.innerText || data.textContent || '';
	}

	/**
	 * Check if paragraph is empty
	 */
	validate(savedData: ParagraphData): boolean {
		return !!savedData.text.trim() || !!this.config.preserveBlank;
	}

	/**
	 * Merge paragraphs on backspace
	 */
	merge(data: ParagraphData): void {
		this.data.text += data.text;
		this.renderContent();
	}
}
