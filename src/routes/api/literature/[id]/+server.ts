/**
 * Literature API - Single Entry Operations
 * 
 * GET, PUT, DELETE for individual literature entries.
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

// GET /api/literature/[id] - Get single literature entry
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		const result = await query<LiteratureRow>(
			`SELECT id, title, authors, year, csl_json, bibtex, doi, created_at, updated_at
			 FROM literature
			 WHERE id = $1 AND user_id = $2`,
			[params.id, locals.user.id]
		);
		
		if (result.rows.length === 0) {
			return json({ error: 'Literature entry not found' }, { status: 404 });
		}
		
		const row = result.rows[0];
		return json({
			success: true,
			data: {
				id: row.id,
				title: row.title,
				authors: row.authors,
				year: row.year,
				cslJson: row.csl_json,
				bibtex: row.bibtex,
				doi: row.doi,
				createdAt: row.created_at,
				updatedAt: row.updated_at,
			},
		});
	} catch (err) {
		console.error('Failed to fetch literature entry:', err);
		return json({ error: 'Failed to fetch literature entry' }, { status: 500 });
	}
};

// PUT /api/literature/[id] - Update literature entry
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		const body = await request.json();
		const { title, authors, year, cslJson, bibtex, doi } = body;
		
		// Verify ownership
		const existing = await query<{ id: string }>(
			'SELECT id FROM literature WHERE id = $1 AND user_id = $2',
			[params.id, locals.user.id]
		);
		
		if (existing.rows.length === 0) {
			return json({ error: 'Literature entry not found' }, { status: 404 });
		}
		
		const result = await query<{ id: string; updated_at: Date }>(
			`UPDATE literature 
			 SET title = COALESCE($1, title),
			     authors = COALESCE($2, authors),
			     year = COALESCE($3, year),
			     csl_json = COALESCE($4, csl_json),
			     bibtex = COALESCE($5, bibtex),
			     doi = COALESCE($6, doi),
			     updated_at = NOW()
			 WHERE id = $7 AND user_id = $8
			 RETURNING id, updated_at`,
			[
				title,
				authors,
				year,
				cslJson ? JSON.stringify(cslJson) : null,
				bibtex,
				doi,
				params.id,
				locals.user.id,
			]
		);
		
		return json({
			success: true,
			data: {
				id: result.rows[0].id,
				updatedAt: result.rows[0].updated_at,
			},
		});
	} catch (err) {
		console.error('Failed to update literature entry:', err);
		return json({ error: 'Failed to update literature entry' }, { status: 500 });
	}
};

// DELETE /api/literature/[id] - Delete literature entry
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		const result = await query<{ id: string }>(
			'DELETE FROM literature WHERE id = $1 AND user_id = $2 RETURNING id',
			[params.id, locals.user.id]
		);
		
		if (result.rows.length === 0) {
			return json({ error: 'Literature entry not found' }, { status: 404 });
		}
		
		return json({
			success: true,
			message: 'Literature entry deleted',
		});
	} catch (err) {
		console.error('Failed to delete literature entry:', err);
		return json({ error: 'Failed to delete literature entry' }, { status: 500 });
	}
};
