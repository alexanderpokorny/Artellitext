/**
 * Math Inline Tool for Editor.js
 * 
 * Detects $...$ patterns and renders inline LaTeX.
 * Supports $$...$$ for display mode in paragraph.
 * Works as a text processor, not a separate block type.
 */

import katex from 'katex';

interface InlineToolAPI {
	selection: {
		findParentTag: (tagName: string, className?: string) => HTMLElement | null;
		expandToTag: (tag: HTMLElement) => void;
	};
}

/**
 * MathInlineTool - Inline tool for math notation
 * 
 * Converts $...$ syntax to rendered KaTeX inline math
 */
export default class MathInlineTool {
	private api: InlineToolAPI;
	private button: HTMLButtonElement | null = null;
	private state: boolean = false;

	static get isInline(): boolean {
		return true;
	}

	static get title(): string {
		return 'Math';
	}

	static get sanitize() {
		return {
			span: {
				class: true,
				'data-latex': true,
			},
		};
	}

	constructor({ api }: { api: InlineToolAPI }) {
		this.api = api;
	}

	/**
	 * Render tool button
	 */
	render(): HTMLButtonElement {
		this.button = document.createElement('button');
		this.button.type = 'button';
		this.button.classList.add('ce-inline-tool');
		this.button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 4L4 20h4l1.5-4h5l1.5 4h4L12 4zm-1.5 10l1.5-4 1.5 4h-3z" fill="currentColor"/></svg>';
		this.button.title = 'Math ($...$)';
		
		return this.button;
	}

	/**
	 * Wrap selected text with math rendering
	 */
	surround(range: Range): void {
		if (this.state) {
			// Unwrap - find and remove the math span
			const mathSpan = this.api.selection.findParentTag('SPAN', 'math-inline');
			if (mathSpan) {
				const latex = mathSpan.dataset.latex || '';
				const textNode = document.createTextNode(`$${latex}$`);
				mathSpan.replaceWith(textNode);
			}
		} else {
			// Wrap - convert selected text to math
			const selectedText = range.toString().trim();
			if (!selectedText) return;

			// Remove surrounding $ if present
			let latex = selectedText;
			if (latex.startsWith('$') && latex.endsWith('$')) {
				latex = latex.slice(1, -1);
			}

			const mathSpan = this.createMathElement(latex);
			range.deleteContents();
			range.insertNode(mathSpan);
		}
	}

	/**
	 * Check if current selection has math formatting
	 */
	checkState(): boolean {
		const mathSpan = this.api.selection.findParentTag('SPAN', 'math-inline');
		this.state = !!mathSpan;
		return this.state;
	}

	/**
	 * Create a math-rendered span element
	 */
	private createMathElement(latex: string): HTMLSpanElement {
		const span = document.createElement('span');
		span.classList.add('math-inline');
		span.dataset.latex = latex;
		span.contentEditable = 'false';
		
		try {
			span.innerHTML = katex.renderToString(latex, {
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
		} catch (error) {
			span.textContent = `$${latex}$`;
			span.classList.add('math-error');
		}
		
		return span;
	}

	/**
	 * No additional actions needed
	 */
	renderActions(): HTMLElement | null {
		return null;
	}

	/**
	 * Clear tool state
	 */
	clear(): void {
		this.state = false;
	}
}

/**
 * Process paragraph text for $...$ and $$...$$ patterns
 * This can be used as a post-processor for paragraphs
 * 
 * @param text - The paragraph text to process
 * @returns HTML string with rendered math
 */
export function processMathInText(text: string): string {
	// Process display math first ($$...$$)
	let result = text.replace(/\$\$([^$]+)\$\$/g, (_, latex) => {
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
			return `<div class="math-display" data-latex="${escapeHtml(latex.trim())}">${html}</div>`;
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
			return `<span class="math-inline" data-latex="${escapeHtml(latex.trim())}">${html}</span>`;
		} catch {
			return `$${latex}$`;
		}
	});

	return result;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
	};
	return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Create an aligned equation environment
 * Usage: \begin{align} x &= 1 \\ y &= 2 \end{align}
 * 
 * @param equations - Array of equation strings with & for alignment
 * @returns KaTeX-rendered HTML
 */
export function renderAlignedEquations(equations: string[], numbered = true): string {
	const aligned = equations.join(' \\\\ ');
	const env = numbered ? 'align' : 'align*';
	const latex = `\\begin{${env}} ${aligned} \\end{${env}}`;
	
	try {
		return katex.renderToString(latex, {
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
	} catch (error) {
		return `<span class="math-error">Error rendering aligned equations</span>`;
	}
}
