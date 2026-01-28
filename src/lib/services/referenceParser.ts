/**
 * Reference Parser Service
 * 
 * Handles import and export of bibliographic references in multiple formats:
 * - BibTeX
 * - CSV
 * - Excel (XLSX)
 */

export interface Reference {
	id?: string;
	title: string;
	authors: string[];
	year?: number;
	doi?: string;
	url?: string;
	type?: string; // article, book, inproceedings, etc.
	journal?: string;
	volume?: string;
	issue?: string;
	pages?: string;
	publisher?: string;
	abstract?: string;
	keywords?: string[];
	bibtex?: string;
	cslJson?: Record<string, any>;
}

/**
 * Parse BibTeX format
 */
export function parseBibtex(text: string): Reference[] {
	const references: Reference[] = [];
	
	// Match BibTeX entries: @type{key, ... }
	const entryRegex = /@(\w+)\s*{\s*([^,]*),([^@]*)}/g;
	let match;
	
	while ((match = entryRegex.exec(text)) !== null) {
		const type = match[1].toLowerCase();
		const key = match[2].trim();
		const body = match[3];
		
		// Parse fields
		const fields: Record<string, string> = {};
		const fieldRegex = /(\w+)\s*=\s*(?:{([^}]*)}|"([^"]*)"|(\d+))/g;
		let fieldMatch;
		
		while ((fieldMatch = fieldRegex.exec(body)) !== null) {
			const fieldName = fieldMatch[1].toLowerCase();
			const fieldValue = fieldMatch[2] || fieldMatch[3] || fieldMatch[4] || '';
			fields[fieldName] = fieldValue.trim();
		}
		
		// Parse authors (separated by "and")
		const authors = fields.author 
			? fields.author.split(/\s+and\s+/i).map(a => a.trim())
			: [];
		
		// Build reference object
		const ref: Reference = {
			title: fields.title || '',
			authors,
			year: fields.year ? parseInt(fields.year, 10) : undefined,
			doi: fields.doi,
			url: fields.url,
			type,
			journal: fields.journal || fields.booktitle,
			volume: fields.volume,
			issue: fields.number,
			pages: fields.pages,
			publisher: fields.publisher,
			abstract: fields.abstract,
			keywords: fields.keywords?.split(',').map(k => k.trim()),
			bibtex: match[0],
		};
		
		// Build CSL-JSON
		ref.cslJson = buildCslJson(ref, key);
		
		references.push(ref);
	}
	
	return references;
}

/**
 * Parse CSV format
 * Expected columns: title, authors, year, doi, url, type, journal, volume, issue, pages
 */
export function parseCsv(text: string): Reference[] {
	const lines = text.split('\n').filter(l => l.trim());
	if (lines.length < 2) return [];
	
	// Parse header
	const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
	const references: Reference[] = [];
	
	for (let i = 1; i < lines.length; i++) {
		const values = parseCSVLine(lines[i]);
		const obj: Record<string, string> = {};
		
		headers.forEach((header, idx) => {
			obj[header] = values[idx] || '';
		});
		
		const ref: Reference = {
			title: obj.title || '',
			authors: obj.authors ? obj.authors.split(';').map(a => a.trim()) : [],
			year: obj.year ? parseInt(obj.year, 10) : undefined,
			doi: obj.doi,
			url: obj.url,
			type: obj.type || 'article',
			journal: obj.journal,
			volume: obj.volume,
			issue: obj.issue,
			pages: obj.pages,
			publisher: obj.publisher,
			abstract: obj.abstract,
		};
		
		ref.cslJson = buildCslJson(ref, `ref-${i}`);
		references.push(ref);
	}
	
	return references;
}

/**
 * Parse a CSV line respecting quoted fields
 */
function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;
	
	for (const char of line) {
		if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === ',' && !inQuotes) {
			result.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}
	result.push(current.trim());
	
	return result;
}

/**
 * Build CSL-JSON from reference
 */
function buildCslJson(ref: Reference, id: string): Record<string, any> {
	const typeMap: Record<string, string> = {
		article: 'article-journal',
		inproceedings: 'paper-conference',
		book: 'book',
		incollection: 'chapter',
		phdthesis: 'thesis',
		mastersthesis: 'thesis',
		techreport: 'report',
		misc: 'document',
	};
	
	return {
		id,
		type: typeMap[ref.type || 'article'] || 'article-journal',
		title: ref.title,
		author: ref.authors.map(name => {
			const parts = name.split(',');
			if (parts.length === 2) {
				return { family: parts[0].trim(), given: parts[1].trim() };
			}
			const nameParts = name.split(' ');
			return {
				family: nameParts.pop() || '',
				given: nameParts.join(' '),
			};
		}),
		issued: ref.year ? { 'date-parts': [[ref.year]] } : undefined,
		DOI: ref.doi,
		URL: ref.url,
		'container-title': ref.journal,
		volume: ref.volume,
		issue: ref.issue,
		page: ref.pages,
		publisher: ref.publisher,
		abstract: ref.abstract,
	};
}

/**
 * Export references to BibTeX format
 */
export function exportToBibtex(references: Reference[]): string {
	return references.map((ref, idx) => {
		if (ref.bibtex) return ref.bibtex;
		
		const type = ref.type || 'article';
		const key = `ref${idx + 1}`;
		const fields: string[] = [];
		
		if (ref.title) fields.push(`  title = {${ref.title}}`);
		if (ref.authors?.length) fields.push(`  author = {${ref.authors.join(' and ')}}`);
		if (ref.year) fields.push(`  year = {${ref.year}}`);
		if (ref.journal) fields.push(`  journal = {${ref.journal}}`);
		if (ref.volume) fields.push(`  volume = {${ref.volume}}`);
		if (ref.issue) fields.push(`  number = {${ref.issue}}`);
		if (ref.pages) fields.push(`  pages = {${ref.pages}}`);
		if (ref.doi) fields.push(`  doi = {${ref.doi}}`);
		if (ref.url) fields.push(`  url = {${ref.url}}`);
		if (ref.publisher) fields.push(`  publisher = {${ref.publisher}}`);
		if (ref.abstract) fields.push(`  abstract = {${ref.abstract}}`);
		
		return `@${type}{${key},\n${fields.join(',\n')}\n}`;
	}).join('\n\n');
}

/**
 * Export references to CSV format
 */
export function exportToCsv(references: Reference[]): string {
	const headers = ['title', 'authors', 'year', 'doi', 'url', 'type', 'journal', 'volume', 'issue', 'pages', 'publisher', 'abstract'];
	const lines = [headers.join(',')];
	
	for (const ref of references) {
		const row = [
			escapeCSV(ref.title || ''),
			escapeCSV(ref.authors?.join('; ') || ''),
			ref.year?.toString() || '',
			escapeCSV(ref.doi || ''),
			escapeCSV(ref.url || ''),
			escapeCSV(ref.type || ''),
			escapeCSV(ref.journal || ''),
			escapeCSV(ref.volume || ''),
			escapeCSV(ref.issue || ''),
			escapeCSV(ref.pages || ''),
			escapeCSV(ref.publisher || ''),
			escapeCSV(ref.abstract || ''),
		];
		lines.push(row.join(','));
	}
	
	return lines.join('\n');
}

/**
 * Escape CSV field
 */
function escapeCSV(value: string): string {
	if (value.includes(',') || value.includes('"') || value.includes('\n')) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

/**
 * Export references to Excel format (XLSX)
 */
export async function exportToExcel(references: Reference[]): Promise<Blob> {
	// Dynamically import xlsx library
	const XLSX = await import('xlsx');
	
	const data = references.map(ref => ({
		Title: ref.title || '',
		Authors: ref.authors?.join('; ') || '',
		Year: ref.year || '',
		DOI: ref.doi || '',
		URL: ref.url || '',
		Type: ref.type || '',
		Journal: ref.journal || '',
		Volume: ref.volume || '',
		Issue: ref.issue || '',
		Pages: ref.pages || '',
		Publisher: ref.publisher || '',
		Abstract: ref.abstract || '',
	}));
	
	const worksheet = XLSX.utils.json_to_sheet(data);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, 'References');
	
	const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
	return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
