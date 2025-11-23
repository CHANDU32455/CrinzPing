// IndexedDB cache utility for storing large data (posts, reels with files)
// This solves localStorage quota issues for data with images/videos

const DB_NAME = 'CrinzPingCache';
const STORE_NAME = 'cache';
const DB_VERSION = 1;

interface CacheItem<T> {
    key: string;
    value: T;
    expiry: number;
}

class IndexedDBCache {
    private dbPromise: Promise<IDBDatabase> | null = null;

    /**
     * Initialize and open the IndexedDB database
     */
    private async openDB(): Promise<IDBDatabase> {
        if (this.dbPromise) {
            return this.dbPromise;
        }

        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('[IndexedDB] Error opening database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                    console.log('[IndexedDB] Object store created');
                }
            };
        });

        return this.dbPromise;
    }

    /**
     * Get an item from cache
     * Returns null if not found or expired
     */
    async getItem<T>(key: string): Promise<T | null> {
        try {
            const db = await this.openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);

                request.onsuccess = () => {
                    const item = request.result as CacheItem<T> | undefined;

                    if (!item) {
                        resolve(null);
                        return;
                    }

                    // Check if expired
                    if (Date.now() > item.expiry) {
                        console.log(`[IndexedDB Cache EXPIRED] Key: "${key}"`);
                        // Remove expired item
                        this.removeItem(key);
                        resolve(null);
                        return;
                    }

                    console.log(`[IndexedDB Cache HIT] Key: "${key}"`);
                    resolve(item.value);
                };

                request.onerror = () => {
                    console.error(`[IndexedDB] Error getting key "${key}":`, request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error(`[IndexedDB] Failed to get item "${key}":`, error);
            return null;
        }
    }

    /**
     * Set an item in cache with TTL
     * @param key - Cache key
     * @param value - Value to cache
     * @param ttl - Time to live in milliseconds (default: 1 hour)
     */
    async setItem<T>(key: string, value: T, ttl: number = 3600000): Promise<void> {
        try {
            const db = await this.openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);

                const item: CacheItem<T> = {
                    key,
                    value,
                    expiry: Date.now() + ttl
                };

                const request = store.put(item);

                request.onsuccess = () => {
                    console.log(`[IndexedDB Cache SET] Key: "${key}", TTL: ${ttl}ms`);
                    resolve();
                };

                request.onerror = () => {
                    console.error(`[IndexedDB] Error setting key "${key}":`, request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error(`[IndexedDB] Failed to set item "${key}":`, error);
            // Don't throw - graceful degradation
        }
    }

    /**
     * Remove an item from cache
     */
    async removeItem(key: string): Promise<void> {
        try {
            const db = await this.openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(key);

                request.onsuccess = () => {
                    console.log(`[IndexedDB Cache REMOVE] Key: "${key}"`);
                    resolve();
                };

                request.onerror = () => {
                    console.error(`[IndexedDB] Error removing key "${key}":`, request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error(`[IndexedDB] Failed to remove item "${key}":`, error);
        }
    }

    /**
     * Clear all cache data
     */
    async clear(): Promise<void> {
        try {
            const db = await this.openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.clear();

                request.onsuccess = () => {
                    console.log('[IndexedDB Cache CLEAR] All data removed');
                    resolve();
                };

                request.onerror = () => {
                    console.error('[IndexedDB] Error clearing cache:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('[IndexedDB] Failed to clear cache:', error);
        }
    }

    /**
     * Check if IndexedDB is supported
     */
    static isSupported(): boolean {
        return typeof indexedDB !== 'undefined';
    }
}

// Export singleton instance
export const indexedDBCache = new IndexedDBCache();
