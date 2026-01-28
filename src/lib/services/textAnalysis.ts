/**
 * Artellico - Text Analysis Service
 * 
 * Provides comprehensive text analysis including:
 * - Basic counts (words, sentences, paragraphs)
 * - Readability scores (Flesch, Flesch-Kincaid, Gunning Fog)
 * - Writing quality metrics (Hemingway-style)
 */

export interface TextStats {
	characters: number;
	charactersNoSpaces: number;
	words: number;
	sentences: number;
	paragraphs: number;
	readingTime: number;
	speakingTime: number;
	avgWordsPerSentence: number;
	avgSyllablesPerWord: number;
	fleschReadingEase: number;
	fleschKincaidGrade: number;
	gunningFog: number;
	hardSentences: number;
	veryHardSentences: number;
	adverbs: number;
	passiveVoice: number;
}

// Common adverb patterns (English and German)
const ADVERB_PATTERNS = {
	en: /\b\w+ly\b/gi,
	de: /\b(sehr|wirklich|eigentlich|ziemlich|besonders|absolut|völlig|total|extrem|unglaublich|definitiv|tatsächlich|natürlich|grundsätzlich|normalerweise|gewöhnlich|meistens|manchmal|selten|niemals|immer|oft|häufig)\b/gi,
};

// Passive voice patterns
const PASSIVE_PATTERNS = {
	en: /\b(am|is|are|was|were|be|been|being)\s+\w+ed\b/gi,
	de: /\b(wurde|werden|wird|worden|geworden)\b/gi,
};

/**
 * Count syllables in a word (English approximation)
 */
function countSyllables(word: string): number {
	word = word.toLowerCase().replace(/[^a-zäöüß]/g, '');
	if (word.length <= 3) return 1;
	
	// Handle common German umlauts
	word = word.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');
	
	// Count vowel groups
	const vowelGroups = word.match(/[aeiouy]+/g);
	if (!vowelGroups) return 1;
	
	let count = vowelGroups.length;
	
	// Subtract silent e at end
	if (word.endsWith('e') && count > 1) count--;
	
	// Handle -le endings
	if (word.endsWith('le') && word.length > 2 && !/[aeiouy]le$/.test(word)) count++;
	
	return Math.max(1, count);
}

/**
 * Calculate Flesch Reading Ease score
 * 100 = very easy, 0 = very difficult
 */
function calculateFleschReadingEase(words: number, sentences: number, syllables: number): number {
	if (words === 0 || sentences === 0) return 0;
	const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
	return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Calculate Flesch-Kincaid Grade Level
 */
function calculateFleschKincaidGrade(words: number, sentences: number, syllables: number): number {
	if (words === 0 || sentences === 0) return 0;
	const grade = (0.39 * (words / sentences)) + (11.8 * (syllables / words)) - 15.59;
	return Math.max(0, grade);
}

/**
 * Calculate Gunning Fog Index
 */
function calculateGunningFog(words: number, sentences: number, complexWords: number): number {
	if (words === 0 || sentences === 0) return 0;
	return 0.4 * ((words / sentences) + 100 * (complexWords / words));
}

/**
 * Detect language from text (simple heuristic)
 */
function detectLanguage(text: string): 'en' | 'de' {
	const germanIndicators = /\b(der|die|das|und|ist|ein|eine|nicht|mit|für|auf|dem|den|auch|als|von|sich|bei|sind|werden|wurde|haben|kann|werden)\b/gi;
	const germanMatches = (text.match(germanIndicators) || []).length;
	const wordCount = text.split(/\s+/).length;
	
	// If more than 10% German indicators, assume German
	return germanMatches / wordCount > 0.1 ? 'de' : 'en';
}

/**
 * Analyze text and return comprehensive statistics
 */
export function analyzeText(text: string): TextStats {
	// Clean text
	const cleanText = text.replace(/<[^>]*>/g, '').trim();
	
	if (!cleanText) {
		return getEmptyStats();
	}
	
	const lang = detectLanguage(cleanText);
	
	// Basic counts
	const characters = cleanText.length;
	const charactersNoSpaces = cleanText.replace(/\s/g, '').length;
	
	// Words
	const wordMatches = cleanText.match(/\b[\wäöüßÄÖÜ]+\b/g) || [];
	const words = wordMatches.length;
	
	// Sentences (approximate - split on . ! ?)
	const sentenceMatches = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
	const sentences = Math.max(1, sentenceMatches.length);
	
	// Paragraphs (split on double newlines or single newlines)
	const paragraphs = Math.max(1, cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 0).length);
	
	// Syllables
	const totalSyllables = wordMatches.reduce((sum, word) => sum + countSyllables(word), 0);
	const avgSyllablesPerWord = words > 0 ? totalSyllables / words : 0;
	
	// Complex words (3+ syllables)
	const complexWords = wordMatches.filter(word => countSyllables(word) >= 3).length;
	
	// Time estimates
	const readingTime = Math.max(1, Math.ceil(words / 200)); // 200 WPM
	const speakingTime = Math.max(1, Math.ceil(words / 130)); // 130 WPM
	
	// Averages
	const avgWordsPerSentence = words / sentences;
	
	// Readability scores
	const fleschReadingEase = calculateFleschReadingEase(words, sentences, totalSyllables);
	const fleschKincaidGrade = calculateFleschKincaidGrade(words, sentences, totalSyllables);
	const gunningFog = calculateGunningFog(words, sentences, complexWords);
	
	// Writing quality metrics
	const hardSentences = countHardSentences(sentenceMatches, 14, 25);
	const veryHardSentences = countHardSentences(sentenceMatches, 25, Infinity);
	const adverbs = (cleanText.match(ADVERB_PATTERNS[lang]) || []).length;
	const passiveVoice = (cleanText.match(PASSIVE_PATTERNS[lang]) || []).length;
	
	return {
		characters,
		charactersNoSpaces,
		words,
		sentences,
		paragraphs,
		readingTime,
		speakingTime,
		avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
		avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
		fleschReadingEase,
		fleschKincaidGrade,
		gunningFog,
		hardSentences,
		veryHardSentences,
		adverbs,
		passiveVoice,
	};
}

/**
 * Count sentences that are hard to read (based on word count)
 */
function countHardSentences(sentences: string[], minWords: number, maxWords: number): number {
	return sentences.filter(sentence => {
		const wordCount = (sentence.match(/\b[\wäöüßÄÖÜ]+\b/g) || []).length;
		return wordCount >= minWords && wordCount < maxWords;
	}).length;
}

/**
 * Return empty stats object
 */
export function getEmptyStats(): TextStats {
	return {
		characters: 0,
		charactersNoSpaces: 0,
		words: 0,
		sentences: 0,
		paragraphs: 0,
		readingTime: 0,
		speakingTime: 0,
		avgWordsPerSentence: 0,
		avgSyllablesPerWord: 0,
		fleschReadingEase: 0,
		fleschKincaidGrade: 0,
		gunningFog: 0,
		hardSentences: 0,
		veryHardSentences: 0,
		adverbs: 0,
		passiveVoice: 0,
	};
}

/**
 * Extract plain text from Editor.js content
 */
export function extractTextFromBlocks(blocks: Array<{ type: string; data: Record<string, unknown> }>): string {
	if (!blocks) return '';
	
	const textParts: string[] = [];
	
	for (const block of blocks) {
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
		}
	}
	
	return textParts.join('\n\n');
}
