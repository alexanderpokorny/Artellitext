/**
 * Documents API - List & Create
 * 
 * GET  /api/documents - List user's documents
 * POST /api/documents - Upload new document
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSession } from '$lib/server/session';
import { query, sql } from '$lib/server/db';
import {
	uploadFile,
	generatePresignedUploadUrl,
	getStorageMode,
	deleteFile
} from '$lib/server/storage';
import { v4 as uuidv4 } from 'uuid';

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
	'application/pdf',
	'application/epub+zip',
	'text/plain',
	'text/markdown',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
	'image/png',
	'image/jpeg',
	'image/webp'
];

/**
 * GET /api/documents
 * List all documents for the current user
 */
export const GET: RequestHandler = async ({ cookies, url }) => {
	const session = await getSession(cookies);
	if (!session?.user) {
		throw error(401, 'Nicht angemeldet');
	}

	const limit = parseInt(url.searchParams.get('limit') || '50');
	const offset = parseInt(url.searchParams.get('offset') || '0');
	const status = url.searchParams.get('status') || 'ready';

	try {
		const result = await query(
			`SELECT id, title, filename, mime_type, size, status, tags, created_at, updated_at
			 FROM documents
			 WHERE user_id = $1 AND status = $2
			 ORDER BY created_at DESC
			 LIMIT $3 OFFSET $4`,
			[session.user.id, status, limit, offset]
		);

		// Get total count
		const countResult = await query(
			`SELECT COUNT(*) as total FROM documents WHERE user_id = $1 AND status = $2`,
			[session.user.id, status]
		);

		return json({
			documents: result.rows,
			total: parseInt(countResult.rows[0]?.total || '0'),
			limit,
			offset
		});
	} catch (err) {
		console.error('Error fetching documents:', err);
		throw error(500, 'Fehler beim Laden der Dokumente');
	}
};

/**
 * POST /api/documents
 * Upload a new document
 * 
 * Supports two modes:
 * 1. Direct upload (multipart/form-data)
 * 2. Presigned URL request (application/json with { filename, mimeType, size })
 */
export const POST: RequestHandler = async ({ cookies, request }) => {
	const session = await getSession(cookies);
	if (!session?.user) {
		throw error(401, 'Nicht angemeldet');
	}

	const contentType = request.headers.get('content-type') || '';

	// Mode 1: Request presigned URL for client-side upload
	if (contentType.includes('application/json')) {
		return handlePresignedUrlRequest(request, session.user.id);
	}

	// Mode 2: Direct upload via multipart/form-data
	if (contentType.includes('multipart/form-data')) {
		return handleDirectUpload(request, session.user.id);
	}

	throw error(400, 'Ungültiger Content-Type');
};

/**
 * Handle presigned URL request for client-side upload
 */
async function handlePresignedUrlRequest(request: Request, userId: string) {
	const body = await request.json();
	const { filename, mimeType, size, title } = body;

	// Validate
	if (!filename || !mimeType || !size) {
		throw error(400, 'filename, mimeType und size sind erforderlich');
	}

	if (size > MAX_FILE_SIZE) {
		throw error(400, `Datei zu groß. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
	}

	if (!ALLOWED_TYPES.includes(mimeType)) {
		throw error(400, `Dateityp nicht erlaubt: ${mimeType}`);
	}

	// Create document record
	const documentId = uuidv4();
	const storagePath = `users/${userId}/documents/${documentId}/${filename}`;

	try {
		// Insert document with 'processing' status
		await query(
			`INSERT INTO documents (id, user_id, title, filename, mime_type, size, storage_path, status)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, 'processing')`,
			[documentId, userId, title || filename, filename, mimeType, size, storagePath]
		);

		// Generate presigned URL
		const uploadUrl = await generatePresignedUploadUrl(storagePath, mimeType, 3600);

		return json({
			documentId,
			uploadUrl,
			storagePath,
			storageMode: getStorageMode()
		});
	} catch (err) {
		console.error('Error creating document:', err);
		throw error(500, 'Fehler beim Erstellen des Dokuments');
	}
}

/**
 * Handle direct file upload via multipart/form-data
 */
async function handleDirectUpload(request: Request, userId: string) {
	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const title = formData.get('title') as string | null;
	const tags = formData.get('tags') as string | null;

	if (!file) {
		throw error(400, 'Keine Datei hochgeladen');
	}

	// Validate
	if (file.size > MAX_FILE_SIZE) {
		throw error(400, `Datei zu groß. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
	}

	if (!ALLOWED_TYPES.includes(file.type)) {
		throw error(400, `Dateityp nicht erlaubt: ${file.type}`);
	}

	const documentId = uuidv4();
	const storagePath = `users/${userId}/documents/${documentId}/${file.name}`;

	try {
		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Upload to storage
		await uploadFile(storagePath, buffer, file.type);

		// Parse tags
		const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

		// Insert document record
		const result = await query(
			`INSERT INTO documents (id, user_id, title, filename, mime_type, size, storage_path, status, tags)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, 'ready', $8)
			 RETURNING id, title, filename, mime_type, size, status, tags, created_at`,
			[documentId, userId, title || file.name, file.name, file.type, file.size, storagePath, tagArray]
		);

		return json({
			document: result.rows[0],
			storageMode: getStorageMode()
		}, { status: 201 });
	} catch (err) {
		console.error('Error uploading document:', err);
		// Cleanup on error
		try {
			await deleteFile(storagePath);
		} catch {}
		throw error(500, 'Fehler beim Hochladen der Datei');
	}
}
