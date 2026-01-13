/**
 * MinIO/S3-Compatible Storage Service
 * 
 * This module provides file storage functionality using MinIO or any S3-compatible storage.
 * Supports upload, download, delete, and presigned URL generation.
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

// Environment configuration
const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT || '';
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'artellico';
const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY || '';
const STORAGE_SECRET_KEY = process.env.STORAGE_SECRET_KEY || '';
const STORAGE_REGION = process.env.STORAGE_REGION || 'eu-central-1';

// Check if storage is configured
export const isStorageConfigured = (): boolean => {
	return !!(STORAGE_ENDPOINT && STORAGE_ACCESS_KEY && STORAGE_SECRET_KEY);
};

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
 * Upload a file to storage
 */
export async function uploadFile(
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
 * Download a file from storage
 */
export async function downloadFile(
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
 * Get file as Buffer
 */
export async function getFileAsBuffer(
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
 * Delete a file from storage
 */
export async function deleteFile(
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
 * Check if a file exists
 */
export async function fileExists(
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
 * Get file metadata
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
 * List files in a directory/prefix
 */
export async function listFiles(
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
 * Generate a presigned URL for upload (PUT)
 */
export async function getPresignedUploadUrl(
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
 * Generate a presigned URL for download (GET)
 */
export async function getPresignedDownloadUrl(
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
