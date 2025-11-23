import { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { indexedDBCache } from "../utils/indexedDBCache";

type FileItem = {
  s3Key: string;
  type: string;
  url: string;
};

type Post = {
  postId: string;
  type: string;
  caption: string;
  tags: string[];
  timestamp: number;
  files: FileItem[];
  likes: number;
  comments: number;
  likedByUser: boolean;
  userId: string;
};

type UserDetails = {
  userName: string;
  userProfilePic: string;
  userTagline: string;
};

type ApiResponse = {
  posts: Post[];
  userDetails: UserDetails;
  hasMore: boolean;
  lastKey?: string;
};

type CachedData = {
  posts: Post[];
  userDetails: UserDetails;
  hasMore: boolean;
  lastKey: string | null;
};

export const useUserPosts = (type: "crinzpostsmeme" | "crinzpostsreels", userId?: string) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastKey, setLastKey] = useState<string | null>(null);

  // Generate unique cache key based on type and userId
  const getCacheKey = () => {
    const typeKey = type === "crinzpostsmeme" ? "memes" : "reels";
    return `user_posts_${userId || user?.profile?.sub}_${typeKey}`;
  };

  const fetchData = async (isLoadMore = false, isRefresh = false) => {
    if (!user?.access_token) return;

    // Cache First Strategy: Only fetch if no cache exists OR explicit refresh OR pagination
    if (!isLoadMore && !isRefresh) {
      try {
        const cacheKey = getCacheKey();
        const cachedData = await indexedDBCache.getItem<CachedData>(cacheKey);
        if (cachedData) {
          console.log(`[Posts Cache HIT] Using cached data for ${type}`);
          setPosts(cachedData.posts);
          setUserDetails(cachedData.userDetails);
          setLastKey(cachedData.lastKey);
          setHasMore(cachedData.hasMore);
          setLoading(false);
          return; // Skip API call
        }
      } catch (error) {
        console.error('[IndexedDB] Cache read failed, continuing with fetch:', error);
        // Continue to fetch if cache fails
      }
    }

    const payload: any = {
      type,
      limit: 20
    };

    if (isLoadMore && lastKey) {
      payload.lastKey = lastKey;
    }

    if (userId) {
      payload.userId = userId;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/fetchUserPostsAndReels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: ApiResponse = await res.json();

      if (data.posts && data.posts.length > 0) {
        if (isLoadMore) {
          setPosts(prev => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
          // Update IndexedDB cache (only for first page)
          try {
            const cacheKey = getCacheKey();
            const cacheData: CachedData = {
              posts: data.posts,
              userDetails: data.userDetails || { userName: "", userProfilePic: "", userTagline: "" },
              hasMore: data.hasMore === true,
              lastKey: data.lastKey || null
            };
            await indexedDBCache.setItem(cacheKey, cacheData, 3600000); // 1 hour TTL
          } catch (cacheError) {
            console.error('[IndexedDB] Cache write failed (continuing):', cacheError);
            // Continue without caching - app still works
          }
        }
        setUserDetails(data.userDetails || null);
        setLastKey(data.lastKey || null);
        setHasMore(data.hasMore === true);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchData(true, false);
    }
  };

  const refreshPosts = () => {
    setPosts([]);
    setUserDetails(null);
    setLastKey(null);
    setHasMore(true);
    fetchData(false, true); // Explicit refresh
  };

  useEffect(() => {
    setLoading(true);
    fetchData(false, false).finally(() => setLoading(false));
  }, [type, user?.access_token, userId]);

  return {
    posts,
    userDetails,
    loading,
    hasMore,
    loadMore,
    refreshPosts
  };
};

export const useUserMemes = (userId?: string) => useUserPosts("crinzpostsmeme", userId);
export const useUserReels = (userId?: string) => useUserPosts("crinzpostsreels", userId);