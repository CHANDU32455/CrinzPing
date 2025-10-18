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

const CACHE_KEY = "crinz_messages_cache";
const SESSION_FLAG_KEY = "crinz_feed_fetched_this_session";

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

        console.log("Fetching messages...");

        const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/getCrinzMessages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bodyPayload),
        });

        if (!res.ok) throw new Error("Failed to fetch messages");

        const data = await res.json();

        const mappedItems = (data.items || []).map((item: any) => ({
          ...item,
          isLiked: item.likedByUser === true,
        }));

        if (postId) {
          const found = mappedItems.some((p: any) => p.crinzId === postId);
          if (!found) {
            console.warn(`Post ${postId} not found in response.`);
            setCrinzNotFoundInResponse(postId);
          } else {
            console.log("Requested post fetched successfully.");
          }
        }

        const combinedPosts = isInitial ? mappedItems : [...crinzPosts, ...mappedItems];
        const postMap = new Map<string, CrinzPost>();
        combinedPosts.forEach((p: CrinzPost) => postMap.set(p.crinzId, p));
        const uniquePosts = Array.from(postMap.values());

        setCrinzPosts(uniquePosts);
        const validLastKey = data.lastKey && Object.keys(data.lastKey).length > 0 ? data.lastKey : null;
        setLastKey(validLastKey);

        // 🔥 FIX: Always update cache for refresh operations, not just for non-postId fetches
        const existingCache = localStorage.getItem(CACHE_KEY);
        let cachedPosts: CrinzPost[] = [];
        if (existingCache) {
          const parsed = JSON.parse(existingCache);
          cachedPosts = parsed.posts || [];
        }

        // For refresh (isInitial), replace cache completely
        // For pagination, merge with existing cache
        let mergedPosts: CrinzPost[];
        if (isInitial) {
          mergedPosts = uniquePosts; // Replace cache on refresh
        } else {
          const mergedPostsMap = new Map<string, CrinzPost>();
          [...cachedPosts, ...uniquePosts].forEach((p) => mergedPostsMap.set(p.crinzId, p));
          mergedPosts = Array.from(mergedPostsMap.values());
        }

        localStorage.setItem(CACHE_KEY, JSON.stringify({
          posts: mergedPosts,
          lastKey: validLastKey,
          timestamp: Date.now() // Add timestamp for cache freshness
        }));

        sessionStorage.setItem(SESSION_FLAG_KEY, "true");
        console.log("Cached posts updated.");
      } catch (err: any) {
        console.error("Error fetching messages:", err.message || err);
        setError(err.message || "Error fetching messages");
      } finally {
        setLoading(false);
        console.log("Fetch finished.");
      }
    },
    [lastKey, loading, crinzPosts, hasMore]
  );

  // Remove the didInitialFetch ref and simplify the initial load logic
  useEffect(() => {
    const fetchedThisSession = sessionStorage.getItem(SESSION_FLAG_KEY);
    const cache = localStorage.getItem(CACHE_KEY);

    if (cache && fetchedThisSession) {
      // Use cached data if we've fetched in this session
      const { posts, lastKey } = JSON.parse(cache);
      console.log(`Loaded ${posts?.length || 0} cached posts.`);
      setCrinzPosts(posts || []);
      setLastKey(lastKey || null);
    } else {
      // Fetch fresh data if no cache or first time in session
      console.log("Initial feed fetch.");
      fetchMessages(true);
    }
  }, []);

  const refresh = useCallback(() => {
    console.log("Refreshing feed...");
    // Clear session flag to force fresh fetch
    sessionStorage.removeItem(SESSION_FLAG_KEY);
    fetchMessages(true);
  }, [fetchMessages]);

  return { crinzPosts, fetchMessages, refresh, loading, error, hasMore, crinzNotFoundInResponse };
};