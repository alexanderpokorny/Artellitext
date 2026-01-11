/**
 * Artellico - Single Note API
 * 
 * REST API endpoints for individual note operations.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { queryOne } from '$lib/server/db';
import type { Note, EditorContent, EditorBlock } from '$lib/types';

/**
 * GET /api/notes/[id] - Get single note
 */
export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	const { id } = params;
	
	try {
		const note = await queryOne<Note>(
			`SELECT * FROM notes WHERE id = $1 AND user_id = $2`,
			[id, locals.user.id]
		);
		
		if (!note) {
			return json({ error: 'Note not found' }, { status: 404 });
		}
		
		return json(note);
	} catch (error) {
		console.error('Error fetching note:', error);
		return json({ error: 'Failed to fetch note' }, { status: 500 });
	}
};

/**
 * PUT /api/notes/[id] - Update note
 */
export const PUT: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	const { id } = params;
	
	try {
		const body = await request.json();
		const { title, content, tags } = body as {
			title?: string;
			content?: EditorContent;
			tags?: string[];
		};
		
		// Verify ownership
		const existing = await queryOne<Note>(
			`SELECT id FROM notes WHERE id = $1 AND user_id = $2`,
			[id, locals.user.id]
		);
		
		if (!existing) {
			return json({ error: 'Note not found' }, { status: 404 });
		}
		
		// Build update query dynamically
		const updates: string[] = [];
		const values: unknown[] = [];
		let paramIndex = 1;
		
		if (title !== undefined) {
			updates.push(`title = $${paramIndex++}`);
			values.push(title);
		}
		
		if (content !== undefined) {
			updates.push(`content = $${paramIndex++}`);
			values.push(JSON.stringify(content));
			
			// Recalculate word count
			const wordCount = content.blocks.reduce((count: number, block: EditorBlock) => {
				if (block.data?.text) {
					return count + String(block.data.text).split(/\s+/).filter(Boolean).length;
				}
				return count;
			}, 0);
			
			updates.push(`word_count = $${paramIndex++}`);
			values.push(wordCount);
			
			updates.push(`reading_time = $${paramIndex++}`);
			values.push(Math.ceil(wordCount / 200));
		}
		
		if (tags !== undefined) {
			updates.push(`tags = $${paramIndex++}`);
			values.push(tags);
		}
		
		updates.push(`updated_at = NOW()`);
		
		values.push(id);
		
		const note = await queryOne<Note>(
			`UPDATE notes SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
			values
		);
		
		return json({ success: true, note });
	} catch (error) {
		console.error('Error updating note:', error);
		return json({ error: 'Failed to update note' }, { status: 500 });
	}
};

/**
 * DELETE /api/notes/[id] - Delete note
 */
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	const { id } = params;
	
	try {
		const result = await queryOne<{ id: string }>(
			`DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id`,
			[id, locals.user.id]
		);
		
		if (!result) {
			return json({ error: 'Note not found' }, { status: 404 });
		}
		
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting note:', error);
		return json({ error: 'Failed to delete note' }, { status: 500 });
	}
};
