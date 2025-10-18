import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";

export interface FeedItem {
  id: string;
  type: "reel" | "post" | "crinz_message";
  userId: string;
  content?: string;
  tags?: string[];
  timestamp: number;
  likeCount?: number;
  commentCount?: number;
  files?: Array<{ type: string; fileName: string; url: string }>;
}

const CACHE_KEY = "personalized_feed_cache";

export const usePersonalizedData = () => {
  const { user } = useAuth();
  const [content, setContent] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const hasFetchedRef = useRef(false);

  // Save to cache
  const saveToCache = useCallback((data: {
    content: FeedItem[];
    lastKey: string | null;
    hasMore: boolean;
  }) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn("Failed to save personalized feed to cache", e);
    }
  }, []);

  // Load from cache
  const loadFromCache = useCallback(() => {
    try {
      const cacheStr = localStorage.getItem(CACHE_KEY);
      if (cacheStr) {
        const cache = JSON.parse(cacheStr);
        if (cache.content && Array.isArray(cache.content)) {
          setContent(cache.content);
          setLastKey(cache.lastKey || null);
          setHasMore(cache.hasMore ?? false);
          return true;
        }
      }
    } catch (e) {
      console.warn("Failed to load personalized feed from cache", e);
      localStorage.removeItem(CACHE_KEY);
    }
    return false;
  }, []);

  const fetchContent = useCallback(
    async (limit = 15, lastKeyParam?: string, isRefresh = false) => {
      if (!user || loading) return;

      setLoading(true);

      try {
        const res = await fetch(
          `${import.meta.env.VITE_BASE_API_URL}/personalization`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.access_token}`,
            },
            body: JSON.stringify({ limit, lastKey: lastKeyParam }),
          }
        );

        const data = await res.json();
        console.log("personalized data:", data);
        
        if (!res.ok) {
          console.error("API Error:", data);
          return;
        }

        if (lastKeyParam && !isRefresh) {
          // Append for pagination
          const newContent = [...content, ...data.feedItems];
          setContent(newContent);
          saveToCache({
            content: newContent,
            lastKey: data.lastKey || null,
            hasMore: data.hasMore ?? false
          });
        } else {
          // Initial load or refresh
          setContent(data.feedItems);
          saveToCache({
            content: data.feedItems,
            lastKey: data.lastKey || null,
            hasMore: data.hasMore ?? false
          });
          if (!isRefresh) {
            hasFetchedRef.current = true;
          }
        }

        setLastKey(data.lastKey || null);
        setHasMore(data.hasMore ?? false);
      } catch (err) {
        console.error("Fetch error:", err);
        // If fetch fails and we have cache, use it
        if (content.length === 0) {
          loadFromCache();
        }
      } finally {
        setLoading(false);
      }
    },
    [user, loading, content, saveToCache, loadFromCache]
  );

  // Initial load - use cache if available
  useEffect(() => {
    if (user && !hasFetchedRef.current) {
      const hasCache = loadFromCache();
      
      // Always try to fetch fresh data, but use cache immediately
      if (hasCache) {
        // Fetch fresh data in background
        fetchContent(15, undefined, false).catch(() => {
          console.log("Background refresh failed, using cached data");
        });
      } else {
        // No cache, wait for fresh data
        fetchContent();
      }
    }
  }, [user]);

  const refresh = useCallback(() => {
    return fetchContent(15, undefined, true);
  }, [fetchContent]);

  return { 
    content, 
    loading, 
    lastKey, 
    hasMore, 
    fetchContent,
    refresh 
  };   
};