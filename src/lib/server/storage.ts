/**
 * Storage Service with S3/MinIO and Local Fallback
 * 
 * Automatically uses local filesystem when S3 is not configured.
 * This enables offline development without MinIO server.
 */

import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	CreateBucketCommand,
	HeadBucketCommand,
	type PutObjectCommandInput,
	type GetObjectCommandInput
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { promises as fs } from 'fs';
import path from 'path';

// Environment configuration
const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT || '';
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'artellico';
const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY || '';
const STORAGE_SECRET_KEY = process.env.STORAGE_SECRET_KEY || '';
const STORAGE_REGION = process.env.STORAGE_REGION || 'eu-central-1';

// Local storage directory (relative to project root)
const LOCAL_STORAGE_DIR = process.env.LOCAL_STORAGE_DIR || './data/storage';

// Storage mode
export type StorageMode = 's3' | 'local';

/**
 * Check if S3 storage is configured
 */
export const isStorageConfigured = (): boolean => {
	return !!(STORAGE_ENDPOINT && STORAGE_ACCESS_KEY && STORAGE_SECRET_KEY);
};

/**
 * Get current storage mode
 */
export const getStorageMode = (): StorageMode => {
	return isStorageConfigured() ? 's3' : 'local';
};

// ===========================================
// LOCAL STORAGE IMPLEMENTATION
// ===========================================

/**
 * Get the full local path for a storage key
 */
function getLocalPath(key: string, bucket: string = STORAGE_BUCKET): string {
	return path.join(LOCAL_STORAGE_DIR, bucket, key);
}

/**
 * Ensure local directory exists
 */
async function ensureLocalDir(filePath: string): Promise<void> {
	const dir = path.dirname(filePath);
	await fs.mkdir(dir, { recursive: true });
}

/**
 * Local: Upload a file
 */
async function localUploadFile(
	key: string,
	body: Buffer | Uint8Array | string,
	contentType: string,
	bucket: string = STORAGE_BUCKET,
	metadata?: Record<string, string>
): Promise<{ key: string; url: string }> {
	const filePath = getLocalPath(key, bucket);
	await ensureLocalDir(filePath);
	
	// Write file
	const buffer = typeof body === 'string' ? Buffer.from(body) : Buffer.from(body);
	await fs.writeFile(filePath, buffer);
	
	// Write metadata
	const metaPath = `${filePath}.meta.json`;
	await fs.writeFile(metaPath, JSON.stringify({
		contentType,
		metadata,
		createdAt: new Date().toISOString()
	}));
	
	return {
		key,
		url: `/api/storage/${bucket}/${key}`
	};
}

/**
 * Local: Download a file
 */
async function localDownloadFile(
	key: string,
	bucket: string = STORAGE_BUCKET
): Promise<{ body: ReadableStream | null; contentType: string | undefined }> {
	const filePath = getLocalPath(key, bucket);
	const metaPath = `${filePath}.meta.json`;
	
	const buffer = await fs.readFile(filePath);
	let contentType: string | undefined;
	
	try {
		const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
		contentType = meta.contentType;
	} catch {
		// No metadata file
	}
	
	// Convert Buffer to ReadableStream
	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(buffer);
			controller.close();
		}
	});
	
	return { body: stream, contentType };
}

/**
 * Local: Get file as Buffer
 */
async function localGetFileAsBuffer(
	key: string,
	bucket: string = STORAGE_BUCKET
): Promise<Buffer> {
	const filePath = getLocalPath(key, bucket);
	return fs.readFile(filePath);
}

/**
 * Local: Delete a file
 */
async function localDeleteFile(
	key: string,
	bucket: string = STORAGE_BUCKET
): Promise<void> {
	const filePath = getLocalPath(key, bucket);
	const metaPath = `${filePath}.meta.json`;
	
	await fs.unlink(filePath).catch(() => {});
	await fs.unlink(metaPath).catch(() => {});
}

/**
 * Local: Check if file exists
 */
async function localFileExists(
	key: string,
	bucket: string = STORAGE_BUCKET
): Promise<boolean> {
	try {
		const filePath = getLocalPath(key, bucket);
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Local: Get file metadata
 */
async function localGetFileMetadata(
	key: string,
	bucket: string = STORAGE_BUCKET
): Promise<{
	contentType?: string;
	contentLength?: number;
	lastModified?: Date;
	metadata?: Record<string, string>;
} | null> {
	try {
		const filePath = getLocalPath(key, bucket);
		const metaPath = `${filePath}.meta.json`;
		
		const stat = await fs.stat(filePath);
		let meta: { contentType?: string; metadata?: Record<string, string> } = {};
		
		try {
			meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
		} catch {
			// No metadata file
		}
		
		return {
			contentType: meta.contentType,
			contentLength: stat.size,
			lastModified: stat.mtime,
			metadata: meta.metadata
		};
	} catch {
		return null;
	}
}

/**
 * Local: List files
 */
async function localListFiles(
	prefix: string = '',
	bucket: string = STORAGE_BUCKET
): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
	const bucketPath = path.join(LOCAL_STORAGE_DIR, bucket);
	const results: Array<{ key: string; size: number; lastModified: Date }> = [];
	
	async function scanDir(dir: string, baseKey: string = ''): Promise<void> {
		try {
			const entries = await fs.readdir(dir, { withFileTypes: true });
			
			for (const entry of entries) {
				const key = baseKey ? `${baseKey}/${entry.name}` : entry.name;
				
				if (entry.isDirectory()) {
					await scanDir(path.join(dir, entry.name), key);
				} else if (!entry.name.endsWith('.meta.json')) {
					if (!prefix || key.startsWith(prefix)) {
						const stat = await fs.stat(path.join(dir, entry.name));
						results.push({
							key,
							size: stat.size,
							lastModified: stat.mtime
						});
					}
				}
			}
		} catch {
			// Directory doesn't exist
		}
	}
	
	await scanDir(bucketPath);
	return results;
}

/**
 * Local: Get presigned URL (returns local API URL)
 */
function localGetPresignedUrl(
	key: string,
	bucket: string = STORAGE_BUCKET,
	_expiresIn: number = 3600
): string {
	return `/api/storage/${bucket}/${key}`;
}

// ===========================================
// S3 STORAGE IMPLEMENTATION
// ===========================================

// Lazy-initialized S3 client
let s3Client: S3Client | null = null;

/**
 * Get or create the S3 client instance
 */
export function getS3Client(): S3Client {
	if (!s3Client) {
		if (!isStorageConfigured()) {
			throw new Error('Storage not configured. Please set STORAGE_ENDPOINT, STORAGE_ACCESS_KEY, and STORAGE_SECRET_KEY.');
		}

		s3Client = new S3Client({
			endpoint: STORAGE_ENDPOINT,
			region: STORAGE_REGION,
			credentials: {
				accessKeyId: STORAGE_ACCESS_KEY,
				secretAccessKey: STORAGE_SECRET_KEY
			},
			forcePathStyle: true // Required for MinIO
		});
	}
	return s3Client;
}

/**
 * Check if a bucket exists
 */
export async function bucketExists(bucket: string = STORAGE_BUCKET): Promise<boolean> {
	try {
		const client = getS3Client();
		await client.send(new HeadBucketCommand({ Bucket: bucket }));
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Create a bucket if it doesn't exist
 */
export async function ensureBucket(bucket: string = STORAGE_BUCKET): Promise<void> {
	const exists = await bucketExists(bucket);
	if (!exists) {
		const client = getS3Client();
		await client.send(new CreateBucketCommand({ Bucket: bucket }));
		console.log(`Bucket "${bucket}" created successfully.`);
	}
}

/**
 * S3: Upload a file to storage
 */
async function s3UploadFile(
	key: string,
	body: Buffer | Uint8Array | string,
	contentType: string,
	bucket: string = STORAGE_BUCKET,
	metadata?: Record<string, string>
): Promise<{ key: string; url: string }> {
	const client = getS3Client();

	const params: PutObjectCommandInput = {
		Bucket: bucket,
		Key: key,
		Body: body,
		ContentType: contentType,
		Metadata: metadata
	};

	await client.send(new PutObjectCommand(params));

	return {
		key,
		url: `${STORAGE_ENDPOINT}/${bucket}/${key}`
	};
}

/**
 * S3: Download a file from storage
 */
async function s3DownloadFile(
	key: string,
	bucket: string = STORAGE_BUCKET
): Promise<{ body: ReadableStream | null; contentType: string | undefined }> {
	const client = getS3Client();

	const params: GetObjectCommandInput = {
		Bucket: bucket,
		Key: key
	};

	const response = await client.send(new GetObjectCommand(params));

	return {
		body: response.Body?.transformToWebStream() ?? null,
		contentType: response.ContentType
	};
}

/**
 * S3: Get file as Buffer
 */
async function s3GetFileAsBuffer(
	key: string,
	bucket: string = STORAGE_BUCKET
): Promise<Buffer> {
	const client = getS3Client();

	const response = await client.send(new GetObjectCommand({
		Bucket: bucket,
		Key: key
	}));

	const bytes = await response.Body?.transformToByteArray();
	return Buffer.from(bytes || []);
}

/**
 * S3: Delete a file from storage
 */
async function s3DeleteFile(
	key: string,
	bucket: string = STORAGE_BUCKET
): Promise<void> {
	const client = getS3Client();

	await client.send(new DeleteObjectCommand({
		Bucket: bucket,
		Key: key
	}));
}

/**
 * S3: Check if a file exists
 */
async function s3FileExists(
	key: string,
	bucket: string = STORAGE_BUCKET
): Promise<boolean> {
	try {
		const client = getS3Client();
		await client.send(new HeadObjectCommand({
			Bucket: bucket,
			Key: key
		}));
		return true;
	} catch {
		return false;
	}
}

/**
 * S3: Get file metadata
 */
async function s3GetFileMetadata(
	key: string,
	bucket: string = STORAGE_BUCKET
): Promise<{
	contentType?: string;
	contentLength?: number;
	lastModified?: Date;
	metadata?: Record<string, string>;
} | null> {
	try {
		const client = getS3Client();
		const response = await client.send(new HeadObjectCommand({
			Bucket: bucket,
			Key: key
		}));

		return {
			contentType: response.ContentType,
			contentLength: response.ContentLength,
			lastModified: response.LastModified,
			metadata: response.Metadata
		};
	} catch {
		return null;
	}
}

/**
 * S3: List files in a directory/prefix
 */
async function s3ListFiles(
	prefix: string = '',
	bucket: string = STORAGE_BUCKET,
	maxKeys: number = 1000
): Promise<Array<{
	key: string;
	size?: number;
	lastModified?: Date;
}>> {
	const client = getS3Client();

	const response = await client.send(new ListObjectsV2Command({
		Bucket: bucket,
		Prefix: prefix,
		MaxKeys: maxKeys
	}));

	return (response.Contents || []).map(item => ({
		key: item.Key || '',
		size: item.Size,
		lastModified: item.LastModified
	}));
}

/**
 * S3: Generate a presigned URL for upload (PUT)
 */
async function s3GetPresignedUploadUrl(
	key: string,
	contentType: string,
	expiresIn: number = 3600,
	bucket: string = STORAGE_BUCKET
): Promise<string> {
	const client = getS3Client();

	const command = new PutObjectCommand({
		Bucket: bucket,
		Key: key,
		ContentType: contentType
	});

	return getSignedUrl(client, command, { expiresIn });
}

/**
 * S3: Generate a presigned URL for download (GET)
 */
async function s3GetPresignedDownloadUrl(
	key: string,
	expiresIn: number = 3600,
	bucket: string = STORAGE_BUCKET
): Promise<string> {
	const client = getS3Client();

	const command = new GetObjectCommand({
		Bucket: bucket,
		Key: key
	});

	return getSignedUrl(client, command, { expiresIn });
}

// ===========================================
// UNIFIED STORAGE API (Auto-selects backend)
// ===========================================

/**
 * Upload a file (auto-selects S3 or local)
 */
export async function uploadFile(
	key: string,
	body: Buffer | Uint8Array | string,
	contentType: string,
	bucket: string = STORAGE_BUCKET,
	metadata?: Record<string, string>
): Promise<{ key: string; url: string }> {
	if (getStorageMode() === 's3') {
		return s3UploadFile(key, body, contentType, bucket, metadata);
	}
	return localUploadFile(key, body, contentType, bucket, metadata);
}

/**
 * Download a file (auto-selects S3 or local)
 */
export async function downloadFile(
	key: string,
	bucket: string = STORAGE_BUCKET
): Promise<{ body: ReadableStream | null; contentType: string | undefined }> {
	if (getStorageMode() === 's3') {
		return s3DownloadFile(key, bucket);
	}
	return localDownloadFile(key, bucket);
}

/**
 * Get file as Buffer (auto-selects S3 or local)
 */
export async function getFileAsBuffer(
	key: string,
	bucket: string = STORAGE_BUCKET
): Promise<Buffer> {
	if (getStorageMode() === 's3') {
		return s3GetFileAsBuffer(key, bucket);
	}
	return localGetFileAsBuffer(key, bucket);
}

/**
 * Delete a file (auto-selects S3 or local)
 */
export async function deleteFile(
	key: string,
	bucket: string = STORAGE_BUCKET
): Promise<void> {
	if (getStorageMode() === 's3') {
		return s3DeleteFile(key, bucket);
	}
	return localDeleteFile(key, bucket);
}

/**
 * Check if a file exists (auto-selects S3 or local)
 */
export async function fileExists(
	key: string,
	bucket: string = STORAGE_BUCKET
): Promise<boolean> {
	if (getStorageMode() === 's3') {
		return s3FileExists(key, bucket);
	}
	return localFileExists(key, bucket);
}

/**
 * Get file metadata (auto-selects S3 or local)
 */
export async function getFileMetadata(
	key: string,
	bucket: string = STORAGE_BUCKET
): Promise<{
	contentType?: string;
	contentLength?: number;
	lastModified?: Date;
	metadata?: Record<string, string>;
} | null> {
	if (getStorageMode() === 's3') {
		return s3GetFileMetadata(key, bucket);
	}
	return localGetFileMetadata(key, bucket);
}

/**
 * List files (auto-selects S3 or local)
 */
export async function listFiles(
	prefix: string = '',
	bucket: string = STORAGE_BUCKET,
	maxKeys: number = 1000
): Promise<Array<{ key: string; size?: number; lastModified?: Date }>> {
	if (getStorageMode() === 's3') {
		return s3ListFiles(prefix, bucket, maxKeys);
	}
	return localListFiles(prefix, bucket);
}

/**
 * Get presigned upload URL (S3) or local API URL
 */
export async function getPresignedUploadUrl(
	key: string,
	contentType: string,
	expiresIn: number = 3600,
	bucket: string = STORAGE_BUCKET
): Promise<string> {
	if (getStorageMode() === 's3') {
		return s3GetPresignedUploadUrl(key, contentType, expiresIn, bucket);
	}
	// For local, return the upload endpoint
	return `/api/storage/upload/${bucket}/${key}`;
}

/**
 * Get presigned download URL (S3) or local API URL
 */
export async function getPresignedDownloadUrl(
	key: string,
	expiresIn: number = 3600,
	bucket: string = STORAGE_BUCKET
): Promise<string> {
	if (getStorageMode() === 's3') {
		return s3GetPresignedDownloadUrl(key, expiresIn, bucket);
	}
	return localGetPresignedUrl(key, bucket, expiresIn);
}

/**
 * Storage paths helpers for organizing files
 */
export const StoragePaths = {
	// User documents (notes, manuscripts)
	userDocument: (userId: string, documentId: string, filename: string) =>
		`users/${userId}/documents/${documentId}/${filename}`,

	// User images (uploaded images for editor)
	userImage: (userId: string, imageId: string, filename: string) =>
		`users/${userId}/images/${imageId}/${filename}`,

	// User avatars
	userAvatar: (userId: string, filename: string) =>
		`users/${userId}/avatar/${filename}`,

	// Exported files (PDF, EPUB, etc.)
	userExport: (userId: string, exportId: string, filename: string) =>
		`users/${userId}/exports/${exportId}/${filename}`,

	// Literature/References attachments
	literatureAttachment: (userId: string, literatureId: string, filename: string) =>
		`users/${userId}/literature/${literatureId}/${filename}`,

	// Temporary files
	temp: (filename: string) =>
		`temp/${filename}`
};

/**
 * Content type detection helper
 */
export function getContentType(filename: string): string {
	const ext = filename.split('.').pop()?.toLowerCase() || '';
	
	const contentTypes: Record<string, string> = {
		// Images
		'jpg': 'image/jpeg',
		'jpeg': 'image/jpeg',
		'png': 'image/png',
		'gif': 'image/gif',
		'webp': 'image/webp',
		'svg': 'image/svg+xml',
		'ico': 'image/x-icon',

		// Documents
		'pdf': 'application/pdf',
		'doc': 'application/msword',
		'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'epub': 'application/epub+zip',
		'mobi': 'application/x-mobipocket-ebook',

		// Text
		'txt': 'text/plain',
		'md': 'text/markdown',
		'html': 'text/html',
		'css': 'text/css',
		'json': 'application/json',
		'xml': 'application/xml',

		// Archives
		'zip': 'application/zip',
		'tar': 'application/x-tar',
		'gz': 'application/gzip',

		// Audio/Video
		'mp3': 'audio/mpeg',
		'mp4': 'video/mp4',
		'webm': 'video/webm'
	};

	return contentTypes[ext] || 'application/octet-stream';
}
