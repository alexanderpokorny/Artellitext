/**
 * CodeTool - Custom Code Block with Syntax Highlighting
 * 
 * Features:
 * - Automatic language detection
 * - Manual language selection via dropdown
 * - Syntax highlighting with highlight.js
 * - Dynamic sizing (grows with content)
 * - Copy to clipboard
 */

import hljs from 'highlight.js/lib/core';
// Import common languages
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import html from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import markdown from 'highlight.js/lib/languages/markdown';
import yaml from 'highlight.js/lib/languages/yaml';
import rust from 'highlight.js/lib/languages/rust';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import csharp from 'highlight.js/lib/languages/csharp';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import latex from 'highlight.js/lib/languages/latex';

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', html);
hljs.registerLanguage('xml', html);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('go', go);
hljs.registerLanguage('java', java);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('php', php);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('latex', latex);
hljs.registerLanguage('tex', latex);

// Language display names
const LANGUAGES = [
	{ value: 'auto', label: 'Auto-detect' },
	{ value: 'javascript', label: 'JavaScript' },
	{ value: 'typescript', label: 'TypeScript' },
	{ value: 'python', label: 'Python' },
	{ value: 'css', label: 'CSS' },
	{ value: 'html', label: 'HTML' },
	{ value: 'json', label: 'JSON' },
	{ value: 'bash', label: 'Bash/Shell' },
	{ value: 'sql', label: 'SQL' },
	{ value: 'markdown', label: 'Markdown' },
	{ value: 'yaml', label: 'YAML' },
	{ value: 'rust', label: 'Rust' },
	{ value: 'go', label: 'Go' },
	{ value: 'java', label: 'Java' },
	{ value: 'csharp', label: 'C#' },
	{ value: 'php', label: 'PHP' },
	{ value: 'ruby', label: 'Ruby' },
	{ value: 'swift', label: 'Swift' },
	{ value: 'kotlin', label: 'Kotlin' },
	{ value: 'latex', label: 'LaTeX' },
	{ value: 'plaintext', label: 'Plain Text' },
];

interface CodeData {
	code: string;
	language: string;
}

interface API {
	styles: {
		block: string;
	};
}

export default class CodeTool {
	private data: CodeData;
	private wrapper: HTMLElement | null = null;
	private textarea: HTMLTextAreaElement | null = null;
	private codeView: HTMLElement | null = null;
	private languageSelect: HTMLSelectElement | null = null;
	private api: API;
	private readOnly: boolean;
	private isEditing = false;

	static get toolbox() {
		return {
			title: 'Code',
			icon: '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M3.177 6.852c.205.253.347.572.427.954.078.372.117.844.117 1.417 0 .418.01.725.03.92.02.18.057.314.107.396.046.075.093.117.14.134.075.027.218.056.42.083a.855.855 0 0 1 .56.297c.145.167.215.398.215.694 0 .3-.07.53-.21.69a.72.72 0 0 1-.51.27c-.77.074-1.35-.032-1.75-.31-.4-.28-.69-.666-.87-1.155-.17-.49-.26-1.04-.27-1.65-.01-.61-.02-1.23-.02-1.85l.02-1.36c.03-.51.1-.95.22-1.33.11-.38.29-.72.53-1.02.24-.3.56-.54.97-.71.4-.18.91-.27 1.52-.27h.1c.09.01.17.03.24.05a.737.737 0 0 1 .54.56c.06.2.09.4.09.62 0 .25-.04.47-.14.66a.79.79 0 0 1-.57.42c-.16.02-.29.05-.39.08-.1.03-.18.08-.24.14-.06.07-.1.17-.13.3-.03.13-.04.3-.04.51v1.85z"/><path d="M10.823 6.852c-.205.253-.347.572-.427.954-.078.372-.117.844-.117 1.417 0 .418-.01.725-.03.92-.02.18-.057.314-.107.396-.046.075-.093.117-.14.134-.075.027-.218.056-.42.083a.855.855 0 0 0-.56.297c-.145.167-.215.398-.215.694 0 .3.07.53.21.69.14.16.31.25.51.27.77.074 1.35-.032 1.75-.31.4-.28.69-.666.87-1.155.17-.49.26-1.04.27-1.65.01-.61.02-1.23.02-1.85l-.02-1.36c-.03-.51-.1-.95-.22-1.33-.11-.38-.29-.72-.53-1.02-.24-.3-.56-.54-.97-.71-.4-.18-.91-.27-1.52-.27h-.1c-.09.01-.17.03-.24.05a.737.737 0 0 0-.54.56c-.06.2-.09.4-.09.62 0 .25.04.47.14.66.1.19.29.34.57.42.16.02.29.05.39.08.1.03.18.08.24.14.06.07.1.17.13.3.03.13.04.3.04.51v1.85z"/></svg>',
		};
	}

	static get isReadOnlySupported() {
		return true;
	}

	static get enableLineBreaks() {
		return true;
	}

	constructor({ data, api, readOnly }: { data: CodeData; api: API; readOnly: boolean }) {
		this.data = {
			code: data.code || '',
			language: data.language || 'auto',
		};
		this.api = api;
		this.readOnly = readOnly;
	}

	render(): HTMLElement {
		this.wrapper = document.createElement('div');
		this.wrapper.classList.add('code-block');

		// Header with language selector and copy button
		const header = document.createElement('div');
		header.classList.add('code-header');

		// Language selector
		this.languageSelect = document.createElement('select');
		this.languageSelect.classList.add('code-language-select');
		
		LANGUAGES.forEach(lang => {
			const option = document.createElement('option');
			option.value = lang.value;
			option.textContent = lang.label;
			if (lang.value === this.data.language) {
				option.selected = true;
			}
			this.languageSelect.appendChild(option);
		});

		this.languageSelect.addEventListener('change', () => {
			this.data.language = this.languageSelect!.value;
			this.updateHighlighting();
		});

		// Copy button
		const copyBtn = document.createElement('button');
		copyBtn.type = 'button';
		copyBtn.classList.add('code-copy-btn');
		copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
		copyBtn.title = 'Copy code';
		copyBtn.addEventListener('click', () => this.copyToClipboard(copyBtn));

		header.appendChild(this.languageSelect);
		header.appendChild(copyBtn);
		this.wrapper.appendChild(header);

		// Code container
		const codeContainer = document.createElement('div');
		codeContainer.classList.add('code-container');

		// Textarea for editing
		this.textarea = document.createElement('textarea');
		this.textarea.classList.add('code-textarea');
		this.textarea.value = this.data.code;
		this.textarea.placeholder = 'Enter code...';
		this.textarea.spellcheck = false;
		
		if (this.readOnly) {
			this.textarea.readOnly = true;
		}

		// Auto-resize
		this.textarea.addEventListener('input', () => {
			this.data.code = this.textarea!.value;
			this.autoResize();
			// Update highlighting when typing pauses
			clearTimeout((this as any).highlightTimeout);
			(this as any).highlightTimeout = setTimeout(() => {
				this.updateHighlighting();
			}, 500);
		});

		// Tab support
		this.textarea.addEventListener('keydown', (e) => {
			if (e.key === 'Tab') {
				e.preventDefault();
				const start = this.textarea!.selectionStart;
				const end = this.textarea!.selectionEnd;
				const value = this.textarea!.value;
				this.textarea!.value = value.substring(0, start) + '\t' + value.substring(end);
				this.textarea!.selectionStart = this.textarea!.selectionEnd = start + 1;
				this.data.code = this.textarea!.value;
			}
		});

		// Focus handling
		this.textarea.addEventListener('focus', () => {
			this.isEditing = true;
			this.wrapper?.classList.add('editing');
		});

		this.textarea.addEventListener('blur', () => {
			this.isEditing = false;
			this.wrapper?.classList.remove('editing');
			this.updateHighlighting();
		});

		// Highlighted code view (for display)
		this.codeView = document.createElement('pre');
		this.codeView.classList.add('code-view');
		const codeElement = document.createElement('code');
		this.codeView.appendChild(codeElement);

		// Click to edit
		this.codeView.addEventListener('click', () => {
			if (!this.readOnly) {
				this.textarea?.focus();
			}
		});

		codeContainer.appendChild(this.textarea);
		codeContainer.appendChild(this.codeView);
		this.wrapper.appendChild(codeContainer);

		// Initial sizing and highlighting
		setTimeout(() => {
			this.autoResize();
			this.updateHighlighting();
		}, 0);

		return this.wrapper;
	}

	private autoResize(): void {
		if (!this.textarea) return;
		this.textarea.style.height = 'auto';
		// Minimum one line, grows with content
		const lineHeight = parseInt(getComputedStyle(this.textarea).lineHeight) || 20;
		const minHeight = lineHeight + 16; // One line + padding
		this.textarea.style.height = Math.max(minHeight, this.textarea.scrollHeight) + 'px';
	}

	private updateHighlighting(): void {
		if (!this.codeView) return;
		
		const codeElement = this.codeView.querySelector('code');
		if (!codeElement) return;

		const code = this.data.code;
		let language = this.data.language;
		let detectedLanguage = '';

		if (language === 'auto' && code.trim()) {
			// Auto-detect language
			const result = hljs.highlightAuto(code);
			detectedLanguage = result.language || 'plaintext';
			codeElement.innerHTML = result.value;
			codeElement.className = `hljs language-${detectedLanguage}`;
			
			// Update dropdown to show detected language
			if (this.languageSelect && detectedLanguage) {
				// Find matching option
				const option = Array.from(this.languageSelect.options).find(
					opt => opt.value === detectedLanguage
				);
				if (option) {
					this.languageSelect.value = 'auto';
					// Could show detected language in UI
				}
			}
		} else if (language && language !== 'auto' && language !== 'plaintext') {
			// Use specified language
			try {
				const result = hljs.highlight(code, { language });
				codeElement.innerHTML = result.value;
				codeElement.className = `hljs language-${language}`;
			} catch {
				codeElement.textContent = code;
				codeElement.className = 'hljs';
			}
		} else {
			// Plain text
			codeElement.textContent = code;
			codeElement.className = 'hljs';
		}

		// Sync view height with textarea
		if (this.textarea) {
			this.codeView.style.height = this.textarea.style.height;
		}
	}

	private async copyToClipboard(btn: HTMLButtonElement): Promise<void> {
		try {
			await navigator.clipboard.writeText(this.data.code);
			btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
			btn.title = 'Copied!';
			setTimeout(() => {
				btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
				btn.title = 'Copy code';
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	save(): CodeData {
		return {
			code: this.data.code,
			language: this.data.language,
		};
	}

	validate(savedData: CodeData): boolean {
		return !!savedData.code.trim();
	}
}
