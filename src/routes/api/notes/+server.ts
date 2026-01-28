/**
 * Artellico - Notes API
 * 
 * REST API endpoints for note CRUD operations.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query, queryOne } from '$lib/server/db';
import type { Note, EditorContent, EditorBlock } from '$lib/types';

/**
 * GET /api/notes - List user's notes
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
	const offset = (page - 1) * limit;
	const tag = url.searchParams.get('tag');
	const sortBy = url.searchParams.get('sort') || 'updated';
	const sortOrder = url.searchParams.get('order') || 'desc';
	
	// Map sort fields to database columns
	const sortColumnMap: Record<string, string> = {
		updated: 'updated_at',
		created: 'created_at',
		title: 'title',
		words: 'word_count',
	};
	const sortColumn = sortColumnMap[sortBy] || 'updated_at';
	const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
	
	try {
		let notes: any[];
		let total: number;
		
		const baseSelect = `SELECT id, title, content, summary, status, tags, word_count, reading_time, created_at, updated_at FROM notes`;
		
		if (tag) {
			const result = await query(
				`${baseSelect}
				 WHERE user_id = $1 AND $2 = ANY(tags)
				 ORDER BY ${sortColumn} ${orderDirection}
				 LIMIT $3 OFFSET $4`,
				[locals.user.id, tag, limit, offset]
			);
			notes = result.rows;
			
			const countResult = await queryOne<{ count: string }>(
				`SELECT COUNT(*) as count FROM notes WHERE user_id = $1 AND $2 = ANY(tags)`,
				[locals.user.id, tag]
			);
			total = parseInt(countResult?.count || '0');
		} else {
			const result = await query(
				`${baseSelect}
				 WHERE user_id = $1
				 ORDER BY ${sortColumn} ${orderDirection}
				 LIMIT $2 OFFSET $3`,
				[locals.user.id, limit, offset]
			);
			notes = result.rows;
			
			const countResult = await queryOne<{ count: string }>(
				`SELECT COUNT(*) as count FROM notes WHERE user_id = $1`,
				[locals.user.id]
			);
			total = parseInt(countResult?.count || '0');
		}
		
		return json({
			items: notes,
			total,
			page,
			pageSize: limit,
			hasMore: offset + notes.length < total,
		});
	} catch (error) {
		console.error('Error fetching notes:', error);
		return json({ error: 'Failed to fetch notes' }, { status: 500 });
	}
};

/**
 * POST /api/notes - Create new note
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		const body = await request.json();
		const { title, content, tags = [] } = body as {
			title: string;
			content: EditorContent;
			tags: string[];
		};
		
		if (!title || !content) {
			return json({ error: 'Title and content are required' }, { status: 400 });
		}
		
		// Calculate word count from content blocks
		const wordCount = content.blocks.reduce((count: number, block: EditorBlock) => {
			if (block.data?.text) {
				return count + String(block.data.text).split(/\s+/).filter(Boolean).length;
			}
			return count;
		}, 0);
		
		const readingTime = Math.ceil(wordCount / 200);
		
		const note = await queryOne<Note>(
			`INSERT INTO notes (user_id, title, content, tags, word_count, reading_time)
			 VALUES ($1, $2, $3, $4, $5, $6)
			 RETURNING *`,
			[
				locals.user.id,
				title,
				JSON.stringify(content),
				tags,
				wordCount,
				readingTime,
			]
		);
		
		return json({ success: true, note }, { status: 201 });
	} catch (error) {
		console.error('Error creating note:', error);
		return json({ error: 'Failed to create note' }, { status: 500 });
	}
};
