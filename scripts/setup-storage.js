#!/usr/bin/env node
/**
 * MinIO Storage Setup Script
 * 
 * This script tests the MinIO connection and creates the required bucket.
 * 
 * Usage:
 *   node scripts/setup-storage.js
 * 
 * Required environment variables:
 *   - STORAGE_ENDPOINT
 *   - STORAGE_ACCESS_KEY
 *   - STORAGE_SECRET_KEY
 *   - STORAGE_BUCKET (optional, defaults to 'artellico')
 */

import {
	S3Client,
	CreateBucketCommand,
	HeadBucketCommand,
	ListBucketsCommand,
	PutBucketPolicyCommand
} from '@aws-sdk/client-s3';
import 'dotenv/config';

const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT;
const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY;
const STORAGE_SECRET_KEY = process.env.STORAGE_SECRET_KEY;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'artellico';
const STORAGE_REGION = process.env.STORAGE_REGION || 'eu-central-1';

// Color helpers for console output
const colors = {
	green: (text) => `\x1b[32m${text}\x1b[0m`,
	red: (text) => `\x1b[31m${text}\x1b[0m`,
	yellow: (text) => `\x1b[33m${text}\x1b[0m`,
	blue: (text) => `\x1b[34m${text}\x1b[0m`,
	bold: (text) => `\x1b[1m${text}\x1b[0m`
};

console.log(colors.bold('\n🗄️  MinIO/S3 Storage Setup\n'));
console.log('─'.repeat(50));

// Check environment variables
console.log('\n📋 Checking configuration...\n');

const configItems = [
	{ name: 'STORAGE_ENDPOINT', value: STORAGE_ENDPOINT, required: true },
	{ name: 'STORAGE_ACCESS_KEY', value: STORAGE_ACCESS_KEY ? '***' + STORAGE_ACCESS_KEY.slice(-4) : undefined, required: true },
	{ name: 'STORAGE_SECRET_KEY', value: STORAGE_SECRET_KEY ? '********' : undefined, required: true },
	{ name: 'STORAGE_BUCKET', value: STORAGE_BUCKET, required: false },
	{ name: 'STORAGE_REGION', value: STORAGE_REGION, required: false }
];

let configValid = true;
for (const item of configItems) {
	const status = item.value 
		? colors.green('✓') 
		: (item.required ? colors.red('✗') : colors.yellow('○'));
	const value = item.value || (item.required ? 'MISSING' : 'not set');
	console.log(`  ${status} ${item.name}: ${value}`);
	
	if (item.required && !item.value) {
		configValid = false;
	}
}

if (!configValid) {
	console.log(colors.red('\n❌ Missing required configuration. Please set the environment variables.\n'));
	console.log('You can set them in a .env file or export them in your shell.\n');
	process.exit(1);
}

// Create S3 client
console.log(colors.blue('\n🔌 Connecting to MinIO...\n'));

const s3Client = new S3Client({
	endpoint: STORAGE_ENDPOINT,
	region: STORAGE_REGION,
	credentials: {
		accessKeyId: STORAGE_ACCESS_KEY,
		secretAccessKey: STORAGE_SECRET_KEY
	},
	forcePathStyle: true
});

async function testConnection() {
	try {
		const response = await s3Client.send(new ListBucketsCommand({}));
		console.log(colors.green('  ✓ Connection successful'));
		console.log(`  📦 Existing buckets: ${response.Buckets?.map(b => b.Name).join(', ') || 'none'}`);
		return true;
	} catch (error) {
		console.log(colors.red(`  ✗ Connection failed: ${error.message}`));
		return false;
	}
}

async function bucketExists() {
	try {
		await s3Client.send(new HeadBucketCommand({ Bucket: STORAGE_BUCKET }));
		return true;
	} catch {
		return false;
	}
}

async function createBucket() {
	console.log(colors.blue(`\n📦 Setting up bucket "${STORAGE_BUCKET}"...\n`));
	
	const exists = await bucketExists();
	
	if (exists) {
		console.log(colors.green(`  ✓ Bucket "${STORAGE_BUCKET}" already exists`));
		return true;
	}
	
	try {
		await s3Client.send(new CreateBucketCommand({ Bucket: STORAGE_BUCKET }));
		console.log(colors.green(`  ✓ Bucket "${STORAGE_BUCKET}" created successfully`));
		return true;
	} catch (error) {
		console.log(colors.red(`  ✗ Failed to create bucket: ${error.message}`));
		return false;
	}
}

async function setBucketPolicy() {
	// Policy to allow public read access for certain prefixes (like user avatars)
	// Private by default, presigned URLs for everything else
	const policy = {
		Version: '2012-10-17',
		Statement: [
			{
				Sid: 'PublicReadAvatars',
				Effect: 'Allow',
				Principal: '*',
				Action: ['s3:GetObject'],
				Resource: [`arn:aws:s3:::${STORAGE_BUCKET}/users/*/avatar/*`]
			}
		]
	};

	try {
		await s3Client.send(new PutBucketPolicyCommand({
			Bucket: STORAGE_BUCKET,
			Policy: JSON.stringify(policy)
		}));
		console.log(colors.green('  ✓ Bucket policy configured (avatars are public)'));
		return true;
	} catch (error) {
		console.log(colors.yellow(`  ○ Could not set bucket policy: ${error.message}`));
		console.log('    (This is optional - you can configure policies in the MinIO console)');
		return false;
	}
}

async function main() {
	const connected = await testConnection();
	if (!connected) {
		console.log(colors.red('\n❌ Could not connect to MinIO. Please check your configuration.\n'));
		process.exit(1);
	}
	
	const bucketReady = await createBucket();
	if (!bucketReady) {
		console.log(colors.red('\n❌ Could not set up bucket.\n'));
		process.exit(1);
	}
	
	await setBucketPolicy();
	
	console.log(colors.green('\n✅ Storage setup complete\n'));
	console.log('─'.repeat(50));
	console.log(`\n📝 Storage is ready at: ${STORAGE_ENDPOINT}/${STORAGE_BUCKET}\n`);
	console.log('Next steps:');
	console.log('  1. Make sure your .env file has the correct credentials');
	console.log('  2. The app will now use MinIO for file storage');
	console.log('  3. You can manage files via the MinIO console\n');
}

main().catch(error => {
	console.error(colors.red('\n❌ Unexpected error:'), error.message);
	process.exit(1);
});
