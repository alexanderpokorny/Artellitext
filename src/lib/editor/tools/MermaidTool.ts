/**
 * Mermaid Diagram Block Tool for Editor.js
 * 
 * Renders Mermaid diagrams with live preview.
 * Supports flowcharts, sequence diagrams, class diagrams, etc.
 */

import mermaid from 'mermaid';

interface MermaidData {
	code: string;
	caption?: string;
}

interface MermaidConfig {
	placeholder?: string;
	theme?: string;
}

interface API {
	styles: {
		block: string;
	};
}

export default class MermaidTool {
	private data: MermaidData;
	private wrapper: HTMLElement | null = null;
	private input: HTMLTextAreaElement | null = null;
	private preview: HTMLElement | null = null;
	private api: API;
	private config: MermaidConfig;
	private readOnly: boolean;
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private static instanceCounter = 0;
	private instanceId: number;

	static get toolbox() {
		return {
			title: 'Mermaid',
			icon: '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h2v2H7V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7zm-8 4h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-8 4h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" fill="currentColor"/></svg>',
		};
	}

	static get isReadOnlySupported() {
		return true;
	}

	static get enableLineBreaks() {
		return true;
	}

	constructor({ data, api, config, readOnly }: { data: MermaidData; api: API; config: MermaidConfig; readOnly: boolean }) {
		this.data = {
			code: data.code || this.getDefaultDiagram(),
			caption: data.caption || '',
		};
		this.api = api;
		this.config = config;
		this.readOnly = readOnly;
		this.instanceId = ++MermaidTool.instanceCounter;

		// Initialize mermaid
		mermaid.initialize({
			startOnLoad: false,
			theme: this.getTheme(),
			securityLevel: 'strict',
			fontFamily: 'inherit',
		});
	}

	private getTheme(): string {
		// Detect dark mode
		if (typeof document !== 'undefined') {
			const isDark = document.documentElement.classList.contains('dark');
			return isDark ? 'dark' : 'neutral';
		}
		return this.config.theme || 'neutral';
	}

	private getDefaultDiagram(): string {
		return `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]
    C --> D`;
	}

	render(): HTMLElement {
		this.wrapper = document.createElement('div');
		this.wrapper.classList.add('mermaid-block');

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
		this.preview.classList.add('mermaid-preview');
		this.wrapper.appendChild(this.preview);

		this.renderDiagram();
	}

	private renderEditable(): void {
		if (!this.wrapper) return;

		// Create split view
		const splitView = document.createElement('div');
		splitView.classList.add('mermaid-split');

		// Input area
		const inputContainer = document.createElement('div');
		inputContainer.classList.add('mermaid-input-container');

		const label = document.createElement('span');
		label.classList.add('mermaid-label');
		label.textContent = 'Mermaid Code';
		inputContainer.appendChild(label);

		this.input = document.createElement('textarea');
		this.input.classList.add('mermaid-input');
		this.input.placeholder = this.config.placeholder || 'Enter Mermaid diagram code...';
		this.input.value = this.data.code;
		this.input.spellcheck = false;

		// Live preview with debounce
		this.input.addEventListener('input', () => {
			this.data.code = this.input!.value;

			// Debounce rendering
			if (this.debounceTimer) {
				clearTimeout(this.debounceTimer);
			}
			this.debounceTimer = setTimeout(() => {
				this.renderDiagram();
			}, 300);
		});

		inputContainer.appendChild(this.input);
		splitView.appendChild(inputContainer);

		// Preview area
		const previewContainer = document.createElement('div');
		previewContainer.classList.add('mermaid-preview-container');

		const previewLabel = document.createElement('span');
		previewLabel.classList.add('mermaid-label');
		previewLabel.textContent = 'Preview';
		previewContainer.appendChild(previewLabel);

		this.preview = document.createElement('div');
		this.preview.classList.add('mermaid-preview');
		previewContainer.appendChild(this.preview);

		splitView.appendChild(previewContainer);
		this.wrapper.appendChild(splitView);

		// Controls
		const controls = document.createElement('div');
		controls.classList.add('mermaid-controls');

		// Export SVG button
		const exportBtn = document.createElement('button');
		exportBtn.type = 'button';
		exportBtn.classList.add('mermaid-export-btn');
		exportBtn.textContent = 'Export SVG';
		exportBtn.addEventListener('click', () => this.exportSvg());
		controls.appendChild(exportBtn);

		// Template dropdown
		const templateSelect = document.createElement('select');
		templateSelect.classList.add('mermaid-template');
		templateSelect.innerHTML = `
			<option value="">Insert Template...</option>
			<option value="flowchart">Flowchart</option>
			<option value="sequence">Sequence Diagram</option>
			<option value="class">Class Diagram</option>
			<option value="state">State Diagram</option>
			<option value="er">ER Diagram</option>
			<option value="gantt">Gantt Chart</option>
		`;
		templateSelect.addEventListener('change', () => {
			if (templateSelect.value) {
				this.insertTemplate(templateSelect.value);
				templateSelect.value = '';
			}
		});
		controls.appendChild(templateSelect);

		this.wrapper.appendChild(controls);

		// Initial render
		this.renderDiagram();
	}

	private async renderDiagram(): Promise<void> {
		if (!this.preview) return;

		if (!this.data.code.trim()) {
			this.preview.innerHTML = '<span class="mermaid-placeholder">Diagram preview will appear here</span>';
			return;
		}

		try {
			// Unique ID for this render
			const id = `mermaid-${this.instanceId}-${Date.now()}`;
			
			// Validate and render
			const { svg } = await mermaid.render(id, this.data.code);
			this.preview.innerHTML = svg;
			this.preview.classList.remove('mermaid-error');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Invalid Mermaid syntax';
			this.preview.innerHTML = `<span class="mermaid-error">${message}</span>`;
			this.preview.classList.add('mermaid-error');
		}
	}

	private insertTemplate(type: string): void {
		if (!this.input) return;

		const templates: Record<string, string> = {
			flowchart: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]
    C --> D`,
			sequence: `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob!
    B-->>A: Hi Alice!
    A->>B: How are you?
    B-->>A: Great!`,
			class: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +bark()
    }
    Animal <|-- Dog`,
			state: `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : start
    Processing --> Done : complete
    Processing --> Error : fail
    Done --> [*]
    Error --> Idle : retry`,
			er: `erDiagram
    USER ||--o{ NOTE : creates
    USER {
        uuid id PK
        string email
        string name
    }
    NOTE {
        uuid id PK
        uuid user_id FK
        string title
        text content
    }`,
			gantt: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Planning
    Research    :a1, 2024-01-01, 7d
    Design      :a2, after a1, 5d
    section Development
    Sprint 1    :b1, after a2, 14d
    Sprint 2    :b2, after b1, 14d`,
		};

		if (templates[type]) {
			this.data.code = templates[type];
			this.input.value = templates[type];
			this.renderDiagram();
		}
	}

	private exportSvg(): void {
		if (!this.preview) return;

		const svg = this.preview.querySelector('svg');
		if (!svg) {
			alert('No diagram to export');
			return;
		}

		// Clone and prepare SVG
		const clone = svg.cloneNode(true) as SVGElement;
		clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

		// Create download link
		const blob = new Blob([clone.outerHTML], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'diagram.svg';
		link.click();
		URL.revokeObjectURL(url);
	}

	save(): MermaidData {
		return {
			code: this.data.code,
			caption: this.data.caption,
		};
	}

	static get sanitize() {
		return {
			code: false, // Don't sanitize Mermaid code
			caption: true,
		};
	}
}
