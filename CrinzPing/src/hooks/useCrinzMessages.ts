import { useState, useEffect, useCallback } from "react";

export interface CrinzPost {
  crinzId: string;
  category: string;
  message: string;
  timestamp: string;
  userId: string;
  userName: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
}

const CACHE_KEY = "crinz_messages_cache";
const SESSION_FLAG_KEY = "crinz_feed_fetched_this_session";

export const useCrinzMessages = () => {
  const [crinzPosts, setCrinzPosts] = useState<CrinzPost[]>([]);
  const [lastKey, setLastKey] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Fetch messages from backend
  const fetchMessages = useCallback(
    async (isInitial = false) => {
      if (loading || (!hasMore && !isInitial)) return;

      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("id_token");
        if (!token) {
          throw new Error("No id token found. Please login.");
        }

        // Extract userId from token or your auth state
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));
        const userId = payload["cognito:username"];

        const bodyPayload = {
          limit: 15,
          ...(isInitial ? {} : { lastKey }),
          userId,  // passing userId here
        };

        const res = await fetch(import.meta.env.VITE_GET_CRINZMESSAGES_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bodyPayload),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch messages: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        // console.log("Fetched data:", data);

        const mappedItems = (data.items || []).map((item: any) => ({
          ...item,
          isLiked: item.likedByUser === true,
        }));

        const postMap = new Map<string, CrinzPost>();
        const combinedPosts = isInitial ? mappedItems : [...crinzPosts, ...mappedItems];
        combinedPosts.forEach((post: CrinzPost) => postMap.set(post.crinzId, post));
        const uniquePosts = Array.from(postMap.values());

        setCrinzPosts(uniquePosts);

        const validLastKey = data.lastKey && Object.keys(data.lastKey).length > 0 ? data.lastKey : null;
        setLastKey(validLastKey);
        setHasMore(!!validLastKey);

        localStorage.setItem(CACHE_KEY, JSON.stringify({ posts: uniquePosts, lastKey: validLastKey }));

        sessionStorage.setItem(SESSION_FLAG_KEY, "true");
      } catch (err: any) {
        setError(err.message || "Error fetching messages");
      } finally {
        setLoading(false);
      }
    },
    [lastKey, loading, hasMore, crinzPosts]
  );


  // On mount: decide fetch fresh or load cache
  useEffect(() => {
    const fetchedThisSession = sessionStorage.getItem(SESSION_FLAG_KEY);
    if (!fetchedThisSession) {
      fetchMessages(true);
      console.log("fetched new for this session..");
    } else {
      const cache = localStorage.getItem(CACHE_KEY);
      if (cache) {
        const { posts, lastKey } = JSON.parse(cache);
        setCrinzPosts(posts || []);
        setLastKey(lastKey || null);
      }
    }
  }, []);

  // Refresh helper
  const refresh = useCallback(() => {
    fetchMessages(true);
  }, [fetchMessages]);

  return { crinzPosts, fetchMessages, refresh, loading, error, hasMore };
};
