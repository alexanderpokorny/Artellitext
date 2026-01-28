/**
 * Artellico - Editor Stats Store
 * 
 * Svelte 5 reactive store for global editor statistics.
 * Used to display word count and reading time in the global footer.
 */

// Global editor stats using Svelte 5 runes
let _wordCount = $state(0);
let _readingTime = $state(0);
let _isEditorActive = $state(false);

/**
 * Create the editor stats store
 */
export function createEditorStats() {
	return {
		// Reactive getters
		get wordCount() { return _wordCount; },
		get readingTime() { return _readingTime; },
		get isEditorActive() { return _isEditorActive; },
		
		// Setters
		update(wordCount: number, readingTime: number) {
			_wordCount = wordCount;
			_readingTime = readingTime;
			_isEditorActive = true;
		},
		
		setActive(active: boolean) {
			_isEditorActive = active;
			if (!active) {
				_wordCount = 0;
				_readingTime = 0;
			}
		},
		
		reset() {
			_wordCount = 0;
			_readingTime = 0;
			_isEditorActive = false;
		}
	};
}

// Singleton instance
let instance: ReturnType<typeof createEditorStats> | null = null;

/**
 * Get the editor stats singleton
 */
export function getEditorStats() {
	if (!instance) {
		instance = createEditorStats();
	}
	return instance;
}

/**
 * Calculate word count from text content
 */
export function calculateWordCount(text: string): number {
	if (!text || !text.trim()) return 0;
	
	// Remove HTML tags
	const cleaned = text.replace(/<[^>]*>/g, ' ');
	// Split by whitespace and filter empty
	const words = cleaned.split(/\s+/).filter(word => word.length > 0);
	return words.length;
}

/**
 * Calculate reading time in minutes (average 200 WPM)
 */
export function calculateReadingTime(wordCount: number): number {
	const WPM = 200;
	return Math.max(1, Math.ceil(wordCount / WPM));
}

/**
 * Extract text content from Editor.js data
 */
export function extractTextFromEditorData(data: { blocks: Array<{ type: string; data: Record<string, unknown> }> }): string {
	if (!data?.blocks) return '';
	
	const textParts: string[] = [];
	
	for (const block of data.blocks) {
		switch (block.type) {
			case 'paragraph':
			case 'header':
			case 'quote':
				if (typeof block.data.text === 'string') {
					textParts.push(block.data.text);
				}
				break;
			case 'list':
				if (Array.isArray(block.data.items)) {
					for (const item of block.data.items) {
						if (typeof item === 'string') {
							textParts.push(item);
						} else if (typeof item?.content === 'string') {
							textParts.push(item.content);
						}
					}
				}
				break;
			case 'code':
				if (typeof block.data.code === 'string') {
					textParts.push(block.data.code);
				}
				break;
		}
	}
	
	return textParts.join(' ');
}
