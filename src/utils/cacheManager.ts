/**
 * Cache Manager - Comprehensive local caching strategy
 * Provides IndexedDB-based persistent caching with TTL support
 */

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  metadata?: {
    size?: number;
    type?: string;
    lastAccessed?: number;
  };
}

export interface CacheOptions {
  ttl?: number; // Default 1 hour
  maxSize?: number; // Maximum cache size in MB
  strategy?: 'lru' | 'lfu' | 'fifo'; // Cache eviction strategy
}

class CacheManager {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'TodoAppCache';
  private readonly dbVersion = 1;
  private readonly storeName = 'cache_entries';
  private readonly defaultTTL = 60 * 60 * 1000; // 1 hour
  private readonly maxCacheSize = 50 * 1024 * 1024; // 50MB
  private isInitialized = false;

  constructor() {
    this.initializeDB();
  }

  /**
   * Initialize IndexedDB database
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, falling back to localStorage');
        this.isInitialized = true;
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.warn('IndexedDB failed, falling back to localStorage');
        this.isInitialized = true;
        resolve();
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitialized = true;
        this.cleanupExpiredEntries();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('ttl', 'ttl', { unique: false });
        }
      };
    });
  }

  /**
   * Wait for database initialization
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeDB();
    }
  }

  /**
   * Set cache entry
   */
  async set<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    await this.ensureInitialized();

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl: options.ttl || this.defaultTTL,
      metadata: {
        size: this.calculateSize(data),
        type: typeof data,
        lastAccessed: Date.now()
      }
    };

    // Check cache size and cleanup if needed
    await this.enforceCacheSize();

    if (this.db) {
      // Use IndexedDB
      await this.setIndexedDB(entry);
    } else {
      // Fallback to localStorage
      this.setLocalStorage(entry);
    }

    console.log(`CacheManager: Set cache entry`, { key, size: entry.metadata?.size });
  }

  /**
   * Get cache entry
   */
  async get<T>(key: string): Promise<T | null> {
    await this.ensureInitialized();

    let entry: CacheEntry<T> | null = null;

    if (this.db) {
      entry = await this.getIndexedDB<T>(key);
    } else {
      entry = this.getLocalStorage<T>(key);
    }

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      await this.delete(key);
      return null;
    }

    // Update last accessed time
    if (entry.metadata) {
      entry.metadata.lastAccessed = Date.now();
      await this.updateEntry(entry);
    }

    console.log(`CacheManager: Cache hit for key`, { key });
    return entry.data;
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<void> {
    await this.ensureInitialized();

    if (this.db) {
      await this.deleteIndexedDB(key);
    } else {
      this.deleteLocalStorage(key);
    }

    console.log(`CacheManager: Deleted cache entry`, { key });
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    await this.ensureInitialized();

    if (this.db) {
      await this.clearIndexedDB();
    } else {
      this.clearLocalStorage();
    }

    console.log('CacheManager: Cleared all cache entries');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    entries: number;
    totalSize: number;
    hitRate?: number;
  }> {
    await this.ensureInitialized();

    if (this.db) {
      return await this.getIndexedDBStats();
    } else {
      return this.getLocalStorageStats();
    }
  }

  // IndexedDB operations
  private async setIndexedDB<T>(entry: CacheEntry<T>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getIndexedDB<T>(key: string): Promise<CacheEntry<T> | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve(null);

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteIndexedDB(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve();

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async clearIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve();

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getIndexedDBStats(): Promise<{ entries: number; totalSize: number }> {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve({ entries: 0, totalSize: 0 });

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result;
        let totalSize = 0;

        entries.forEach((entry: CacheEntry) => {
          totalSize += entry.metadata?.size || 0;
        });

        resolve({ entries: entries.length, totalSize });
      };
      request.onerror = () => reject(request.error);
    });
  }

  // localStorage fallback operations
  private setLocalStorage<T>(entry: CacheEntry<T>): void {
    try {
      const key = `cache_${entry.key}`;
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('localStorage cache failed:', error);
    }
  }

  private getLocalStorage<T>(key: string): CacheEntry<T> | null {
    try {
      const cacheKey = `cache_${key}`;
      const data = localStorage.getItem(cacheKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('localStorage cache read failed:', error);
      return null;
    }
  }

  private deleteLocalStorage(key: string): void {
    try {
      const cacheKey = `cache_${key}`;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('localStorage cache delete failed:', error);
    }
  }

  private clearLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('localStorage cache clear failed:', error);
    }
  }

  private getLocalStorageStats(): { entries: number; totalSize: number } {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
      let totalSize = 0;

      keys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          totalSize += new Blob([data]).size;
        }
      });

      return { entries: keys.length, totalSize };
    } catch (error) {
      console.warn('localStorage stats failed:', error);
      return { entries: 0, totalSize: 0 };
    }
  }

  // Utility methods
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }

  private async updateEntry<T>(entry: CacheEntry<T>): Promise<void> {
    if (this.db) {
      await this.setIndexedDB(entry);
    } else {
      this.setLocalStorage(entry);
    }
  }

  private async cleanupExpiredEntries(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const index = store.index('timestamp');

    const range = IDBKeyRange.upperBound(Date.now());
    const request = index.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }

  private async enforceCacheSize(): Promise<void> {
    const stats = await this.getStats();

    if (stats.totalSize > this.maxCacheSize) {
      console.log('CacheManager: Cache size exceeded, cleaning up...');

      // Simple FIFO cleanup - delete oldest entries
      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('timestamp');

        const request = index.openCursor();
        let deletedCount = 0;

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor && deletedCount < 10) { // Delete up to 10 oldest entries
            cursor.delete();
            deletedCount++;
            cursor.continue();
          }
        };
      }
    }
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();
