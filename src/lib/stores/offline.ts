/**
 * Artellico - Offline Store
 * 
 * IndexedDB wrapper for offline data persistence.
 * Implements cache limits and sync queue management.
 */

import { browser } from '$app/environment';
import type { Note, Document } from '$lib/types';

const DB_NAME = 'artellico';
const DB_VERSION = 1;

interface SyncQueueItem {
	id: string;
	type: 'note' | 'document';
	action: 'create' | 'update' | 'delete';
	data: unknown;
	timestamp: number;
	retries: number;
}

class OfflineStore {
	private db: IDBDatabase | null = null;
	private cacheLimit: number = 100;
	
	async init(): Promise<void> {
		if (!browser) return;
		
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);
			
			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};
			
			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				
				// Notes store
				if (!db.objectStoreNames.contains('notes')) {
					const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
					notesStore.createIndex('userId', 'userId', { unique: false });
					notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
				}
				
				// Documents store
				if (!db.objectStoreNames.contains('documents')) {
					const docsStore = db.createObjectStore('documents', { keyPath: 'id' });
					docsStore.createIndex('userId', 'userId', { unique: false });
					docsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
				}
				
				// Sync queue store
				if (!db.objectStoreNames.contains('syncQueue')) {
					const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
					syncStore.createIndex('timestamp', 'timestamp', { unique: false });
				}
				
				// Settings store
				if (!db.objectStoreNames.contains('settings')) {
					db.createObjectStore('settings', { keyPath: 'key' });
				}
			};
		});
	}
	
	setCacheLimit(limit: number): void {
		this.cacheLimit = limit;
	}
	
	// ===========================================
	// NOTES
	// ===========================================
	
	async saveNote(note: Note): Promise<void> {
		if (!this.db) await this.init();
		
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('notes', 'readwrite');
			const store = tx.objectStore('notes');
			
			store.put(note);
			
			tx.oncomplete = () => {
				this.enforceCacheLimit('notes');
				resolve();
			};
			tx.onerror = () => reject(tx.error);
		});
	}
	
	async getNote(id: string): Promise<Note | undefined> {
		if (!this.db) await this.init();
		
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('notes', 'readonly');
			const store = tx.objectStore('notes');
			const request = store.get(id);
			
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}
	
	async getAllNotes(userId: string): Promise<Note[]> {
		if (!this.db) await this.init();
		
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('notes', 'readonly');
			const store = tx.objectStore('notes');
			const index = store.index('userId');
			const request = index.getAll(userId);
			
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}
	
	async deleteNote(id: string): Promise<void> {
		if (!this.db) await this.init();
		
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('notes', 'readwrite');
			const store = tx.objectStore('notes');
			
			store.delete(id);
			
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}
	
	// ===========================================
	// DOCUMENTS
	// ===========================================
	
	async saveDocument(doc: Document): Promise<void> {
		if (!this.db) await this.init();
		
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('documents', 'readwrite');
			const store = tx.objectStore('documents');
			
			store.put(doc);
			
			tx.oncomplete = () => {
				this.enforceCacheLimit('documents');
				resolve();
			};
			tx.onerror = () => reject(tx.error);
		});
	}
	
	async getDocument(id: string): Promise<Document | undefined> {
		if (!this.db) await this.init();
		
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('documents', 'readonly');
			const store = tx.objectStore('documents');
			const request = store.get(id);
			
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}
	
	// ===========================================
	// SYNC QUEUE
	// ===========================================
	
	async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
		if (!this.db) await this.init();
		
		const queueItem: SyncQueueItem = {
			...item,
			id: crypto.randomUUID(),
			timestamp: Date.now(),
			retries: 0,
		};
		
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('syncQueue', 'readwrite');
			const store = tx.objectStore('syncQueue');
			
			store.put(queueItem);
			
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}
	
	async getSyncQueue(): Promise<SyncQueueItem[]> {
		if (!this.db) await this.init();
		
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('syncQueue', 'readonly');
			const store = tx.objectStore('syncQueue');
			const index = store.index('timestamp');
			const request = index.getAll();
			
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}
	
	async removeSyncQueueItem(id: string): Promise<void> {
		if (!this.db) await this.init();
		
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('syncQueue', 'readwrite');
			const store = tx.objectStore('syncQueue');
			
			store.delete(id);
			
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}
	
	async getPendingCount(): Promise<number> {
		const queue = await this.getSyncQueue();
		return queue.length;
	}
	
	// ===========================================
	// SETTINGS
	// ===========================================
	
	async getSetting<T>(key: string): Promise<T | undefined> {
		if (!this.db) await this.init();
		
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('settings', 'readonly');
			const store = tx.objectStore('settings');
			const request = store.get(key);
			
			request.onsuccess = () => resolve(request.result?.value);
			request.onerror = () => reject(request.error);
		});
	}
	
	async setSetting<T>(key: string, value: T): Promise<void> {
		if (!this.db) await this.init();
		
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('settings', 'readwrite');
			const store = tx.objectStore('settings');
			
			store.put({ key, value });
			
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}
	
	// ===========================================
	// CACHE MANAGEMENT
	// ===========================================
	
	private async enforceCacheLimit(storeName: string): Promise<void> {
		if (!this.db) return;
		
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction(storeName, 'readwrite');
			const store = tx.objectStore(storeName);
			const countRequest = store.count();
			
			countRequest.onsuccess = () => {
				const count = countRequest.result;
				
				if (count <= this.cacheLimit) {
					resolve();
					return;
				}
				
				// Delete oldest entries
				const deleteCount = count - this.cacheLimit;
				const index = store.index('updatedAt');
				const cursorRequest = index.openCursor();
				let deleted = 0;
				
				cursorRequest.onsuccess = (event) => {
					const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
					
					if (cursor && deleted < deleteCount) {
						cursor.delete();
						deleted++;
						cursor.continue();
					} else {
						resolve();
					}
				};
			};
			
			countRequest.onerror = () => reject(countRequest.error);
		});
	}
	
	async getCacheStats(): Promise<{ notes: number; documents: number; sizeMB: number }> {
		if (!this.db) await this.init();
		
		const [notesCount, docsCount] = await Promise.all([
			this.getStoreCount('notes'),
			this.getStoreCount('documents'),
		]);
		
		// Estimate size (rough approximation)
		const estimatedSize = (notesCount * 10 + docsCount * 50) / 1024; // KB to MB
		
		return {
			notes: notesCount,
			documents: docsCount,
			sizeMB: Math.round(estimatedSize * 10) / 10,
		};
	}
	
	private async getStoreCount(storeName: string): Promise<number> {
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction(storeName, 'readonly');
			const store = tx.objectStore(storeName);
			const request = store.count();
			
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}
	
	async clearAll(): Promise<void> {
		if (!this.db) return;
		
		const stores = ['notes', 'documents', 'syncQueue'];
		
		for (const storeName of stores) {
			await new Promise<void>((resolve, reject) => {
				const tx = this.db!.transaction(storeName, 'readwrite');
				const store = tx.objectStore(storeName);
				store.clear();
				
				tx.oncomplete = () => resolve();
				tx.onerror = () => reject(tx.error);
			});
		}
	}
}

// Singleton instance
export const offlineStore = new OfflineStore();
