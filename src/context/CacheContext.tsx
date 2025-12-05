/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useCallback, type ReactNode } from 'react';

interface CacheItem<T> {
    value: T;
    expiry: number; // Timestamp when the item expires
}

interface CacheContextType {
    getItem: <T>(key: string) => T | null;
    setItem: <T>(key: string, value: T, ttl?: number) => void;
    removeItem: (key: string) => void;
    clear: () => void;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export const useCache = () => {
    const context = useContext(CacheContext);
    if (!context) {
        throw new Error('useCache must be used within a CacheProvider');
    }
    return context;
};

interface CacheProviderProps {
    children: ReactNode;
}

export const CacheProvider: React.FC<CacheProviderProps> = ({ children }) => {
    // We can use a combination of in-memory state and localStorage for persistence
    // For now, let's rely on localStorage to persist across reloads as per requirements

    const getItem = useCallback(<T,>(key: string): T | null => {
        try {
            const itemStr = localStorage.getItem(key);
            if (!itemStr) return null;

            const item: CacheItem<T> = JSON.parse(itemStr);
            const now = Date.now();

            if (now > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }

            console.log(`[Cache HIT] Key: "${key}"`, item.value);
            return item.value;
        } catch (error) {
            console.error(`Error reading cache key "${key}":`, error);
            return null;
        }
    }, []);

    const setItem = useCallback(<T,>(key: string, value: T, ttl: number = 3600000) => { // Default TTL: 1 hour
        try {
            const now = Date.now();
            const item: CacheItem<T> = {
                value,
                expiry: now + ttl,
            };
            localStorage.setItem(key, JSON.stringify(item));
        } catch (error) {
            console.error(`Error setting cache key "${key}":`, error);
        }
    }, []);

    const removeItem = useCallback((key: string) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing cache key "${key}":`, error);
        }
    }, []);

    const clear = useCallback(() => {
        try {
            localStorage.clear();
        } catch (error) {
            console.error("Error clearing cache:", error);
        }
    }, []);

    return (
        <CacheContext.Provider value={{ getItem, setItem, removeItem, clear }}>
            {children}
        </CacheContext.Provider>
    );
};