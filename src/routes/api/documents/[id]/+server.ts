/**
 * Documents API - Single Document Operations
 * 
 * GET    /api/documents/[id] - Get document details
 * PATCH  /api/documents/[id] - Update document metadata
 * DELETE /api/documents/[id] - Delete document
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/server/db';
import {
	deleteFile,
	getPresignedDownloadUrl,
	getStorageMode
} from '$lib/server/storage';

/**
 * GET /api/documents/[id]
 * Get document details and download URL
 */
export const GET: RequestHandler = async ({ locals, params, url }) => {
	if (!locals.user) {
		throw error(401, 'Nicht angemeldet');
	}

	const { id } = params;
	const download = url.searchParams.get('download') === 'true';

	try {
		const result = await query(
			`SELECT id, user_id, title, filename, mime_type, size, storage_path, 
			        status, tags, metadata, created_at, updated_at
			 FROM documents
			 WHERE id = $1`,
			[id]
		);

		if (result.rows.length === 0) {
			throw error(404, 'Dokument nicht gefunden');
		}

		const document = result.rows[0];

		// Check ownership
		if (document.user_id !== locals.user.id) {
			throw error(403, 'Keine Berechtigung');
		}

		// Generate download URL if requested
		let downloadUrl: string | null = null;
		if (download && document.storage_path) {
			downloadUrl = await getPresignedDownloadUrl(
				document.storage_path,
				3600, // 1 hour
				document.filename
			);
		}

		return json({
			document: {
				id: document.id,
				title: document.title,
				filename: document.filename,
				mimeType: document.mime_type,
				size: document.size,
				status: document.status,
				tags: document.tags,
				metadata: document.metadata,
				createdAt: document.created_at,
				updatedAt: document.updated_at
			},
			downloadUrl,
			storageMode: getStorageMode()
		});
	} catch (err) {
		if (err instanceof Error && 'status' in err) throw err;
		console.error('Error fetching document:', err);
		throw error(500, 'Fehler beim Laden des Dokuments');
	}
};

/**
 * PATCH /api/documents/[id]
 * Update document metadata
 */
export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		throw error(401, 'Nicht angemeldet');
	}

	const { id } = params;
	const body = await request.json();
	const { title, tags, status, metadata } = body;

	try {
		// Verify ownership
		const checkResult = await query<{ user_id: string }>(
			`SELECT user_id FROM documents WHERE id = $1`,
			[id]
		);

		if (checkResult.rows.length === 0) {
			throw error(404, 'Dokument nicht gefunden');
		}

		if (checkResult.rows[0].user_id !== locals.user.id) {
			throw error(403, 'Keine Berechtigung');
		}

		// Build update query dynamically
		const updates: string[] = [];
		const values: unknown[] = [];
		let paramIndex = 1;

		if (title !== undefined) {
			updates.push(`title = $${paramIndex++}`);
			values.push(title);
		}
		if (tags !== undefined) {
			updates.push(`tags = $${paramIndex++}`);
			values.push(tags);
		}
		if (status !== undefined) {
			updates.push(`status = $${paramIndex++}`);
			values.push(status);
		}
		if (metadata !== undefined) {
			updates.push(`metadata = $${paramIndex++}`);
			values.push(JSON.stringify(metadata));
		}

		if (updates.length === 0) {
			throw error(400, 'Keine Änderungen angegeben');
		}

		updates.push(`updated_at = NOW()`);
		values.push(id);

		const result = await query(
			`UPDATE documents 
			 SET ${updates.join(', ')}
			 WHERE id = $${paramIndex}
			 RETURNING id, title, filename, mime_type, size, status, tags, metadata, updated_at`,
			values
		);

		return json({ document: result.rows[0] });
	} catch (err) {
		if (err instanceof Error && 'status' in err) throw err;
		console.error('Error updating document:', err);
		throw error(500, 'Fehler beim Aktualisieren des Dokuments');
	}
};

/**
 * DELETE /api/documents/[id]
 * Delete document and its file from storage
 */
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		throw error(401, 'Nicht angemeldet');
	}

	const { id } = params;

	try {
		// Get document info
		const result = await query<{ user_id: string; storage_path: string | null }>(
			`SELECT user_id, storage_path FROM documents WHERE id = $1`,
			[id]
		);

		if (result.rows.length === 0) {
			throw error(404, 'Dokument nicht gefunden');
		}

		const document = result.rows[0];

		// Check ownership
		if (document.user_id !== locals.user.id) {
			throw error(403, 'Keine Berechtigung');
		}

		// Delete from storage
		if (document.storage_path) {
			try {
				await deleteFile(document.storage_path);
			} catch (err) {
				console.warn('Could not delete file from storage:', err);
				// Continue with database deletion
			}
		}

		// Delete from database
		await query(`DELETE FROM documents WHERE id = $1`, [id]);

		return json({ success: true, deletedId: id });
	} catch (err) {
		if (err instanceof Error && 'status' in err) throw err;
		console.error('Error deleting document:', err);
		throw error(500, 'Fehler beim Löschen des Dokuments');
	}
};
