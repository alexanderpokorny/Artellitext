/**
 * LaTeX Block Tool for Editor.js
 * 
 * Renders LaTeX formulas using KaTeX.
 * Supports both display ($$...$$) and inline ($...$) modes.
 */

import katex from 'katex';

interface MathData {
	latex: string;
	displayMode: boolean;
	caption?: string;
	numbered?: boolean;
}

interface MathConfig {
	placeholder?: string;
}

interface API {
	styles: {
		block: string;
		settingsButton: string;
		settingsButtonActive: string;
	};
	i18n: {
		t: (key: string) => string;
	};
}

export default class MathTool {
	private data: MathData;
	private wrapper: HTMLElement | null = null;
	private input: HTMLTextAreaElement | null = null;
	private preview: HTMLElement | null = null;
	private api: API;
	private config: MathConfig;
	private readOnly: boolean;
	static equationCounter = 0;

	static get toolbox() {
		return {
			title: 'LaTeX',
			icon: '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 4L4 20h4l1.5-4h5l1.5 4h4L12 4zm-1.5 10l1.5-4 1.5 4h-3z" fill="currentColor"/></svg>',
		};
	}

	static get isReadOnlySupported() {
		return true;
	}

	static get enableLineBreaks() {
		return true;
	}

	constructor({ data, api, config, readOnly }: { data: MathData; api: API; config: MathConfig; readOnly: boolean }) {
		this.data = {
			latex: data.latex || '',
			displayMode: data.displayMode !== false,
			caption: data.caption || '',
			numbered: data.numbered ?? true,
		};
		this.api = api;
		this.config = config;
		this.readOnly = readOnly;
	}

	render(): HTMLElement {
		this.wrapper = document.createElement('div');
		this.wrapper.classList.add('math-block');
		this.wrapper.dataset.displayMode = String(this.data.displayMode);

		if (this.readOnly) {
			this.renderReadOnly();
		} else {
			this.renderEditable();
		}

		return this.wrapper;
	}

	private renderReadOnly(): void {
		if (!this.wrapper) return;

		this.preview = document.createElement('div');
		this.preview.classList.add('math-preview');
		this.wrapper.appendChild(this.preview);

		this.renderLatex();
	}

	private renderEditable(): void {
		if (!this.wrapper) return;

		// Create input area
		const inputContainer = document.createElement('div');
		inputContainer.classList.add('math-input-container');

		this.input = document.createElement('textarea');
		this.input.classList.add('math-input');
		this.input.placeholder = this.config.placeholder || 'Enter LaTeX formula...';
		this.input.value = this.data.latex;
		this.input.rows = 3;

		// Live preview on input
		this.input.addEventListener('input', () => {
			this.data.latex = this.input!.value;
			this.renderLatex();
		});

		// Auto-resize textarea
		this.input.addEventListener('input', () => {
			this.input!.style.height = 'auto';
			this.input!.style.height = this.input!.scrollHeight + 'px';
		});

		inputContainer.appendChild(this.input);

		// Create preview area
		this.preview = document.createElement('div');
		this.preview.classList.add('math-preview');

		// Mode toggle
		const controls = document.createElement('div');
		controls.classList.add('math-controls');

		const displayToggle = document.createElement('button');
		displayToggle.type = 'button';
		displayToggle.classList.add('math-toggle');
		displayToggle.textContent = this.data.displayMode ? 'Display Mode' : 'Inline Mode';
		displayToggle.addEventListener('click', () => {
			this.data.displayMode = !this.data.displayMode;
			displayToggle.textContent = this.data.displayMode ? 'Display Mode' : 'Inline Mode';
			this.wrapper!.dataset.displayMode = String(this.data.displayMode);
			this.renderLatex();
		});

		controls.appendChild(displayToggle);

		this.wrapper.appendChild(inputContainer);
		this.wrapper.appendChild(this.preview);
		this.wrapper.appendChild(controls);

		// Initial render
		this.renderLatex();

		// Focus input on click
		this.wrapper.addEventListener('click', (e) => {
			if (e.target === this.wrapper || e.target === this.preview) {
				this.input?.focus();
			}
		});
	}

	private renderLatex(): void {
		if (!this.preview) return;

		if (!this.data.latex.trim()) {
			this.preview.innerHTML = '<span class="math-placeholder">Preview will appear here</span>';
			return;
		}

		try {
			const html = katex.renderToString(this.data.latex, {
				displayMode: this.data.displayMode,
				throwOnError: false,
				errorColor: '#cc0000',
				trust: false,
				strict: false,
				macros: {
					// Common macros
					'\\R': '\\mathbb{R}',
					'\\N': '\\mathbb{N}',
					'\\Z': '\\mathbb{Z}',
					'\\Q': '\\mathbb{Q}',
					'\\C': '\\mathbb{C}',
				},
			});

			// Wrap in equation container for display mode
			if (this.data.displayMode) {
				const number = this.data.numbered ? `<span class="equation-number">(${++MathTool.equationCounter})</span>` : '';
				this.preview.innerHTML = `<div class="equation-wrapper">${html}${number}</div>`;
			} else {
				this.preview.innerHTML = html;
			}

			this.preview.classList.remove('math-error');
		} catch (error) {
			this.preview.innerHTML = `<span class="math-error">Error: ${error instanceof Error ? error.message : 'Invalid LaTeX'}</span>`;
			this.preview.classList.add('math-error');
		}
	}

	save(): MathData {
		return {
			latex: this.data.latex,
			displayMode: this.data.displayMode,
			caption: this.data.caption,
			numbered: this.data.numbered,
		};
	}

	static get sanitize() {
		return {
			latex: false, // Don't sanitize LaTeX
			caption: true,
		};
	}

	renderSettings(): HTMLElement {
		const wrapper = document.createElement('div');
		wrapper.classList.add('math-settings');

		// Numbered toggle
		const numberedBtn = document.createElement('button');
		numberedBtn.type = 'button';
		numberedBtn.classList.add(this.api.styles.settingsButton);
		if (this.data.numbered) {
			numberedBtn.classList.add(this.api.styles.settingsButtonActive);
		}
		numberedBtn.innerHTML = '#';
		numberedBtn.title = 'Toggle numbering';
		numberedBtn.addEventListener('click', () => {
			this.data.numbered = !this.data.numbered;
			numberedBtn.classList.toggle(this.api.styles.settingsButtonActive);
			this.renderLatex();
		});

		wrapper.appendChild(numberedBtn);

		return wrapper;
	}
}
