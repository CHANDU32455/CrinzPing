import { useState, useEffect, useCallback, useMemo, useRef } from "react";

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

  const didInitialFetch = useRef(false);

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

        const res = await fetch(import.meta.env.VITE_GET_CRINZMESSAGES_API_URL, {
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

        if (!postId) {
          const existingCache = localStorage.getItem(CACHE_KEY);
          let cachedPosts: CrinzPost[] = [];
          if (existingCache) {
            const parsed = JSON.parse(existingCache);
            cachedPosts = parsed.posts || [];
          }

          const mergedPostsMap = new Map<string, CrinzPost>();
          [...cachedPosts, ...uniquePosts].forEach((p) => mergedPostsMap.set(p.crinzId, p));
          const mergedPosts = Array.from(mergedPostsMap.values());

          localStorage.setItem(CACHE_KEY, JSON.stringify({ posts: mergedPosts, lastKey: validLastKey }));
          sessionStorage.setItem(SESSION_FLAG_KEY, "true");
          console.log("Cached posts updated.");
        }
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

  useEffect(() => {
    if (didInitialFetch.current) return;
    didInitialFetch.current = true;

    const fetchedThisSession = sessionStorage.getItem(SESSION_FLAG_KEY);
    if (!fetchedThisSession) {
      console.log("Initial feed fetch.");
      fetchMessages(true);
    } else {
      const cache = localStorage.getItem(CACHE_KEY);
      if (cache) {
        const { posts, lastKey } = JSON.parse(cache);
        console.log(`Loaded ${posts?.length || 0} cached posts.`);
        setCrinzPosts(posts || []);
        setLastKey(lastKey || null);
      }
    }
  }, []);

  const refresh = useCallback(() => {
    console.log("Refreshing feed...");
    fetchMessages(true);
  }, [fetchMessages]);

  return { crinzPosts, fetchMessages, refresh, loading, error, hasMore, crinzNotFoundInResponse };
};
