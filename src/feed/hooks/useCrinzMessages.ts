import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";

export interface CrinzPost {
  crinzId: string;
  message: string;
  timestamp: string;
  userId: string;
  userName: string;
  userProfilePic?: string;
  userTagline?: string;
  likeCount: number;
  commentCount: number;
  tags?: string[];
  isLiked?: boolean;
}

// Define proper types for API response and pagination
interface ApiCrinzItem {
  crinzId: string;
  message: string;
  timestamp: string;
  userId: string;
  userName: string;
  userProfilePic?: string;
  userTagline?: string;
  likeCount: number;
  commentCount: number;
  tags?: string[];
  likedByUser?: boolean;
}

interface ApiResponse {
  items: ApiCrinzItem[];
  lastKey?: Record<string, unknown> | null;
}

interface CacheData {
  posts: CrinzPost[];
  lastKey: Record<string, unknown> | null;
  timestamp: number;
}

interface FetchPayload {
  limit: number;
  userId: string;
  lastKey?: Record<string, unknown>;
  postId?: string;
}

const GET_CRINZ_MESSAGES_API = `${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.GET_CRINZ_MESSAGES}`;
const CACHE_KEY = "crinz_messages_cache";

export const useCrinzMessages = () => {
  const [crinzPosts, setCrinzPosts] = useState<CrinzPost[]>([]);
  const [lastKey, setLastKey] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasMore = useMemo(() => !!lastKey, [lastKey]);
  const [crinzNotFoundInResponse, setCrinzNotFoundInResponse] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const initialLoadRef = useRef(false);

  // Save to cache whenever posts change
  const saveToCache = useCallback((posts: CrinzPost[], lastKey: Record<string, unknown> | null) => {
    try {
      const cacheData: CacheData = {
        posts,
        lastKey,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.warn("Failed to save posts to cache", e);
    }
  }, []);

  // Load from cache
  const loadFromCache = useCallback(() => {
    try {
      const cacheStr = localStorage.getItem(CACHE_KEY);
      if (cacheStr) {
        const cache: CacheData = JSON.parse(cacheStr);
        if (cache.posts && Array.isArray(cache.posts)) {
          setCrinzPosts(cache.posts);
          setLastKey(cache.lastKey || null);
          return true;
        }
      }
    } catch (e) {
      console.warn("Failed to load posts from cache", e);
      localStorage.removeItem(CACHE_KEY);
    }
    return false;
  }, []);

  const fetchMessages = useCallback(
    async (isInitial = false, postId?: string, backgroundRefresh = false) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      if ((loading && !backgroundRefresh) || (!hasMore && !isInitial && !postId)) {
        inFlightRef.current = false;
        return;
      }

      try {
        if (!backgroundRefresh) setLoading(true);
        setError(null);
        if (!backgroundRefresh) setCrinzNotFoundInResponse(null);

        const token = localStorage.getItem("id_token");
        if (!token) {
          throw new Error("No id token found. Please login.");
        }

        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = payload["cognito:username"];

        const bodyPayload: FetchPayload = { limit: 15, userId };
        if (!isInitial && lastKey && !backgroundRefresh) bodyPayload.lastKey = lastKey;
        if (postId) bodyPayload.postId = postId;

        console.log("fetching crinzMessages...", { isInitial, backgroundRefresh });
        const res = await fetch(GET_CRINZ_MESSAGES_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bodyPayload),
        });

        if (!res.ok) {
          let errorMsg = `Failed to fetch messages: ${res.status}`;
          if (res.status === 401) {
            localStorage.removeItem("id_token");
            localStorage.removeItem("access_token");
            errorMsg = "Authentication failed. Please login again.";
          }
          throw new Error(errorMsg);
        }

        const data: ApiResponse = await res.json();
        console.log("fetched crinzMessages:", data);

        // Map the response items to include all the new user profile fields
        const mappedItems: CrinzPost[] = (data.items || []).map((item: ApiCrinzItem) => ({
          crinzId: item.crinzId,
          message: item.message,
          timestamp: item.timestamp,
          userId: item.userId,
          userName: item.userName,
          userProfilePic: item.userProfilePic || "", // New field
          userTagline: item.userTagline || "", // New field
          likeCount: item.likeCount,
          commentCount: item.commentCount,
          tags: item.tags || [],
          isLiked: item.likedByUser === true,
        }));

        if (postId && !backgroundRefresh) {
          const found = mappedItems.some((p: CrinzPost) => p.crinzId === postId);
          if (!found) {
            setCrinzNotFoundInResponse(postId);
          }
        }

        if (isInitial) {
          // Replace all posts for initial load
          setCrinzPosts(mappedItems);
          const validLastKey = data.lastKey && Object.keys(data.lastKey).length > 0 ? data.lastKey : null;
          setLastKey(validLastKey);
          saveToCache(mappedItems, validLastKey);
        } else {
          // Append for pagination
          const combinedPosts = [...crinzPosts, ...mappedItems];
          const postMap = new Map<string, CrinzPost>();
          combinedPosts.forEach((p: CrinzPost) => postMap.set(p.crinzId, p));
          const uniquePosts = Array.from(postMap.values());

          setCrinzPosts(uniquePosts);
          const validLastKey = data.lastKey && Object.keys(data.lastKey).length > 0 ? data.lastKey : null;
          setLastKey(validLastKey);
          saveToCache(uniquePosts, validLastKey);
        }

      } catch (err: unknown) {
        console.error("Error fetching messages:", err);
        const errorMessage = err instanceof Error ? err.message : "Error fetching messages";
        setError(errorMessage);
        throw err;
      } finally {
        if (!backgroundRefresh) setLoading(false);
        inFlightRef.current = false;
      }
    },
    [lastKey, loading, crinzPosts, hasMore, saveToCache]
  );

  // Initial load - use cache if available, then refresh in background
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    const loadData = async () => {
      const hasCache = loadFromCache();

      // Always try to fetch fresh data, but don't wait for it if we have cache
      if (hasCache) {
        // Fetch fresh data in background but don't block UI
        fetchMessages(true).catch(() => {
          console.log("Background refresh failed, using cached data");
        });
      } else {
        // No cache, wait for fresh data
        await fetchMessages(true);
      }
    };

    loadData();
  }, [loadFromCache, fetchMessages]);

  // Manual refresh function - always fetches fresh data
  const refresh = useCallback(() => {
    setError(null);
    return fetchMessages(true);
  }, [fetchMessages]);

  const updateLocalPost = useCallback((postId: string, updates: Partial<CrinzPost>) => {
    setCrinzPosts(prev => {
      const updatedPosts = prev.map(post =>
        post.crinzId === postId ? { ...post, ...updates } : post
      );
      saveToCache(updatedPosts, lastKey);
      return updatedPosts;
    });
  }, [lastKey, saveToCache]);

  const addLocalComment = useCallback((postId: string) => {
    setCrinzPosts(prev => {
      const updatedPosts = prev.map(post =>
        post.crinzId === postId ? { ...post, commentCount: post.commentCount + 1 } : post
      );
      saveToCache(updatedPosts, lastKey);
      return updatedPosts;
    });
  }, [lastKey, saveToCache]);

  const removeLocalComment = useCallback((postId: string) => {
    setCrinzPosts(prev => {
      const updatedPosts = prev.map(post =>
        post.crinzId === postId ? { ...post, commentCount: Math.max(0, post.commentCount - 1) } : post
      );
      saveToCache(updatedPosts, lastKey);
      return updatedPosts;
    });
  }, [lastKey, saveToCache]);

  return {
    crinzPosts,
    setCrinzPosts,
    fetchMessages,
    refresh,
    loading,
    error,
    hasMore,
    crinzNotFoundInResponse,
    updateLocalPost,
    addLocalComment,
    removeLocalComment
  };
};