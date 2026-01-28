/**
 * Documents API - Confirm Upload
 * 
 * POST /api/documents/[id]/confirm - Confirm presigned URL upload completed
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/server/db';
import { fileExists } from '$lib/server/storage';

/**
 * POST /api/documents/[id]/confirm
 * Confirm that a presigned URL upload has completed
 * Changes status from 'processing' to 'ready'
 */
export const POST: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		throw error(401, 'Nicht angemeldet');
	}

	const { id } = params;

	try {
		// Get document info
		const result = await query<{ user_id: string; storage_path: string; status: string }>(
			`SELECT user_id, storage_path, status FROM documents WHERE id = $1`,
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

		// Check current status
		if (document.status !== 'processing') {
			throw error(400, 'Dokument ist nicht im Upload-Status');
		}

		// Verify file exists in storage
		const exists = await fileExists(document.storage_path);
		if (!exists) {
			throw error(400, 'Datei wurde nicht gefunden im Storage');
		}

		// Update status to ready
		const updateResult = await query(
			`UPDATE documents 
			 SET status = 'ready', updated_at = NOW()
			 WHERE id = $1
			 RETURNING id, title, filename, mime_type, size, status, tags, created_at, updated_at`,
			[id]
		);

		return json({
			document: updateResult.rows[0],
			message: 'Upload bestätigt'
		});
	} catch (err) {
		if (err instanceof Error && 'status' in err) throw err;
		console.error('Error confirming upload:', err);
		throw error(500, 'Fehler beim Bestätigen des Uploads');
	}
};
