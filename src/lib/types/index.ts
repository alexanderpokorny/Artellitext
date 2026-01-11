/**
 * Artellico - Core Type Definitions
 * 
 * Central type definitions for the entire application.
 * Following the principle of "Cognitive Sovereignty" - clear, precise types.
 */

// ===========================================
// USER & AUTH TYPES
// ===========================================

export interface User {
	id: string;
	email: string;
	username: string;
	displayName: string | null;
	avatarUrl: string | null;
	role: UserRole;
	subscriptionTier: SubscriptionTier;
	language: SupportedLanguage;
	theme: Theme;
	createdAt: Date;
	updatedAt: Date;
	emailVerified: boolean;
	settings: UserSettings;
}

export type UserRole = 'user' | 'admin' | 'superadmin';

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';

export interface UserSettings {
	cacheLimit: number;
	enableGeolocation: boolean;
	defaultCitationFormat: CitationFormat;
	autoSaveInterval: number;
	editorFontSize: number;
	readingModeEnabled: boolean;
	apiKeys: UserApiKeys;
}

export interface UserApiKeys {
	openrouter?: string;
	openai?: string;
	anthropic?: string;
}

export type CitationFormat = 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee' | 'generic';

// ===========================================
// SESSION TYPES
// ===========================================

export interface Session {
	id: string;
	userId: string;
	token: string;
	expiresAt: Date;
	createdAt: Date;
	userAgent: string | null;
	ipAddress: string | null;
}

export interface SessionUser {
	id: string;
	email: string;
	username: string;
	displayName: string | null;
	avatarUrl: string | null;
	role: UserRole;
	subscriptionTier: SubscriptionTier;
}

// ===========================================
// CONTENT TYPES
// ===========================================

export interface Note {
	id: string;
	userId: string;
	title: string;
	content: EditorContent;
	summary: string | null;
	status: ContentStatus;
	tags: string[];
	language: ContentLanguage;
	wordCount: number;
	readingTime: number;
	difficulty: number | null;
	createdAt: Date;
	updatedAt: Date;
	location: GeoLocation | null;
	embedding: number[] | null;
}

export interface EditorContent {
	time: number;
	blocks: EditorBlock[];
	version: string;
}

export interface EditorBlock {
	id: string;
	type: string;
	data: Record<string, unknown>;
}

export type ContentStatus = 'draft' | 'published' | 'archived';

export type ContentLanguage = 'de' | 'en' | 'fr' | 'es' | 'it' | 'mu';

export interface GeoLocation {
	latitude: number;
	longitude: number;
	address?: string;
	timestamp: Date;
}

// ===========================================
// DOCUMENT TYPES
// ===========================================

export interface Document {
	id: string;
	userId: string;
	title: string;
	filename: string;
	mimeType: DocumentMimeType;
	size: number;
	storagePath: string;
	thumbnailPath: string | null;
	metadata: DocumentMetadata;
	fullText: string | null;
	tags: string[];
	status: DocumentStatus;
	createdAt: Date;
	updatedAt: Date;
	embedding: number[] | null;
}

export type DocumentMimeType = 
	| 'application/pdf'
	| 'application/epub+zip'
	| 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	| 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
	| 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
	| 'image/jpeg'
	| 'image/png'
	| 'image/webp';

export interface DocumentMetadata {
	author?: string;
	publisher?: string;
	publishedDate?: string;
	isbn?: string;
	pageCount?: number;
	customFields?: Record<string, string>;
}

export type DocumentStatus = 'processing' | 'ready' | 'error' | 'archived';

// ===========================================
// UI & THEMING TYPES
// ===========================================

export type Theme = 'light' | 'dark' | 'auto';

export type SupportedLanguage = 'de' | 'en' | 'fr' | 'es' | 'it';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface ViewMode {
	layout: 'list' | 'grid' | 'compact';
	sortBy: 'date' | 'title' | 'updated';
	sortOrder: 'asc' | 'desc';
}

// ===========================================
// API RESPONSE TYPES
// ===========================================

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: ApiError;
}

export interface ApiError {
	code: string;
	message: string;
	details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	hasMore: boolean;
}

// ===========================================
// FEATURE FLAGS & SUBSCRIPTION
// ===========================================

export interface FeatureFlags {
	aiFeatures: boolean;
	semanticSearch: boolean;
	documentOcr: boolean;
	teamWorkspaces: boolean;
	versionHistory: boolean;
	prioritySync: boolean;
	customThemes: boolean;
}

export const TIER_FEATURES: Record<SubscriptionTier, FeatureFlags> = {
	free: {
		aiFeatures: false,
		semanticSearch: false,
		documentOcr: false,
		teamWorkspaces: false,
		versionHistory: false,
		prioritySync: false,
		customThemes: false,
	},
	pro: {
		aiFeatures: true,
		semanticSearch: true,
		documentOcr: true,
		teamWorkspaces: false,
		versionHistory: true,
		prioritySync: true,
		customThemes: true,
	},
	team: {
		aiFeatures: true,
		semanticSearch: true,
		documentOcr: true,
		teamWorkspaces: true,
		versionHistory: true,
		prioritySync: true,
		customThemes: true,
	},
	enterprise: {
		aiFeatures: true,
		semanticSearch: true,
		documentOcr: true,
		teamWorkspaces: true,
		versionHistory: true,
		prioritySync: true,
		customThemes: true,
	},
};

// ===========================================
// UTILITY TYPES
// ===========================================

export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
