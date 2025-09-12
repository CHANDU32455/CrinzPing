import { useState, useEffect, useCallback, useMemo } from "react";

export interface CrinzPost {
  crinzId: string;
  message: string;
  timestamp: string;
  userId: string;
  userName: string;
  likeCount: number;
  commentCount: number;
  tags?: string[];
  isLiked?: boolean;
}

const CACHE_KEY = "crinz_messages_cache_v3";
const SESSION_FLAG_KEY = "crinz_feed_fetched_this_session_v2";
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const useCrinzMessages = () => {
  const [crinzPosts, setCrinzPosts] = useState<CrinzPost[]>([]);
  const [lastKey, setLastKey] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasMore = useMemo(() => !!lastKey, [lastKey]);
  const [crinzNotFoundInResponse, setCrinzNotFoundInResponse] = useState<string | null>(null);

  const fetchMessages = useCallback(
    async (isInitial = false, postId?: string) => {
      if (loading || (!hasMore && !isInitial && !postId)) return;

      try {
        setLoading(true);
        setError(null);
        setCrinzNotFoundInResponse(null);

        const token = localStorage.getItem("id_token");
        if (!token) throw new Error("No id token found. Please login.");

        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = payload["cognito:username"];

        const bodyPayload: any = { limit: 15, userId };
        if (!isInitial && lastKey) bodyPayload.lastKey = lastKey;
        if (postId) bodyPayload.postId = postId;

        const res = await fetch(import.meta.env.VITE_GET_CRINZMESSAGES_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bodyPayload),
        });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("id_token");
            localStorage.removeItem("access_token");
            throw new Error("Authentication failed. Please login again.");
          }
          throw new Error(`Failed to fetch messages: ${res.status}`);
        }

        const data = await res.json();

        const mappedItems = (data.items || []).map((item: any) => ({
          ...item,
          isLiked: item.likedByUser === true,
        }));

        if (postId) {
          const found = mappedItems.some((p: any) => p.crinzId === postId);
          if (!found) {
            setCrinzNotFoundInResponse(postId);
          }
        }

        const combinedPosts = isInitial ? mappedItems : [...crinzPosts, ...mappedItems];
        const postMap = new Map<string, CrinzPost>();
        combinedPosts.forEach((p: CrinzPost) => postMap.set(p.crinzId, p));
        const uniquePosts = Array.from(postMap.values());

        setCrinzPosts(uniquePosts);
        const validLastKey = data.lastKey && Object.keys(data.lastKey).length > 0 ? data.lastKey : null;
        setLastKey(validLastKey);

        localStorage.setItem(CACHE_KEY, JSON.stringify({ 
          posts: uniquePosts, 
          lastKey: validLastKey,
          timestamp: Date.now()
        }));
        
        sessionStorage.setItem(SESSION_FLAG_KEY, "true");
      } catch (err: any) {
        console.error("Error fetching messages:", err);
        setError(err.message || "Error fetching messages");
      } finally {
        setLoading(false);
      }
    },
    [lastKey, loading, crinzPosts, hasMore]
  );

  useEffect(() => {
    const fetchedThisSession = sessionStorage.getItem(SESSION_FLAG_KEY);
    const cacheStr = localStorage.getItem(CACHE_KEY);
    
    if (cacheStr) {
      try {
        const cache = JSON.parse(cacheStr);
        const isCacheValid = cache.timestamp && (Date.now() - cache.timestamp) < CACHE_EXPIRY;
        
        if (isCacheValid && fetchedThisSession) {
          setCrinzPosts(cache.posts || []);
          setLastKey(cache.lastKey || null);
          return;
        }
      } catch (e) {
        console.error("Failed to parse cache", e);
        localStorage.removeItem(CACHE_KEY);
      }
    }
    
    fetchMessages(true);
  }, []);

  const refresh = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem(SESSION_FLAG_KEY);
    fetchMessages(true);
  }, [fetchMessages]);

  const updateLocalPost = useCallback((postId: string, updates: Partial<CrinzPost>) => {
    setCrinzPosts(prev => prev.map(post => 
      post.crinzId === postId ? { ...post, ...updates } : post
    ));
  }, []);

  const addLocalComment = useCallback((postId: string) => {
    setCrinzPosts(prev => prev.map(post => 
      post.crinzId === postId ? { ...post, commentCount: post.commentCount + 1 } : post
    ));
  }, []);

  const removeLocalComment = useCallback((postId: string) => {
    setCrinzPosts(prev => prev.map(post => 
      post.crinzId === postId ? { ...post, commentCount: Math.max(0, post.commentCount - 1) } : post
    ));
  }, []);

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