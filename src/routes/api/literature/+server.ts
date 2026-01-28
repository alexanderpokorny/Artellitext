/**
 * Literature API - Citation/Reference Management
 * 
 * Handles CRUD operations for literature references (BibTeX/CSL-JSON).
 * Used by BibTeX import and citation management features.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/server/db';

interface LiteratureRow {
	id: string;
	title: string;
	authors: string[] | null;
	year: number | null;
	csl_json: object | null;
	bibtex: string | null;
	doi: string | null;
	created_at: Date;
	updated_at: Date;
}

// GET /api/literature - List all literature entries
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		const result = await query<LiteratureRow>(
			`SELECT id, title, authors, year, csl_json, bibtex, doi, created_at, updated_at
			 FROM literature
			 WHERE user_id = $1
			 ORDER BY created_at DESC`,
			[locals.user.id]
		);
		
		return json({
			success: true,
			data: result.rows.map(row => ({
				id: row.id,
				title: row.title,
				authors: row.authors,
				year: row.year,
				cslJson: row.csl_json,
				bibtex: row.bibtex,
				doi: row.doi,
				createdAt: row.created_at,
				updatedAt: row.updated_at,
			})),
		});
	} catch (err) {
		console.error('Failed to fetch literature:', err);
		return json({ error: 'Failed to fetch literature' }, { status: 500 });
	}
};

// POST /api/literature - Create new literature entry
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		const body = await request.json();
		const { title, authors, year, cslJson, bibtex, doi } = body;
		
		if (!title) {
			return json({ error: 'Title is required' }, { status: 400 });
		}
		
		// Check for duplicate by DOI
		if (doi) {
			const existing = await query<{ id: string }>(
				'SELECT id FROM literature WHERE user_id = $1 AND doi = $2',
				[locals.user.id, doi]
			);
			if (existing.rows.length > 0) {
				return json({
					success: true,
					data: { id: existing.rows[0].id },
					message: 'Entry already exists',
					duplicate: true,
				});
			}
		}
		
		const result = await query<{ id: string; created_at: Date }>(
			`INSERT INTO literature (user_id, title, authors, year, csl_json, bibtex, doi)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)
			 RETURNING id, created_at`,
			[
				locals.user.id,
				title,
				authors || null,
				year || null,
				cslJson ? JSON.stringify(cslJson) : null,
				bibtex || null,
				doi || null,
			]
		);
		
		return json({
			success: true,
			data: {
				id: result.rows[0].id,
				createdAt: result.rows[0].created_at,
			},
		}, { status: 201 });
	} catch (err) {
		console.error('Failed to create literature entry:', err);
		return json({ error: 'Failed to create literature entry' }, { status: 500 });
	}
};
