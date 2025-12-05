import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";
import { useCache } from "../context/CacheContext";
import { devLog, devError } from "../utils/devLogger";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export interface FeedItem {
  id: string;
  type: "reel" | "post" | "crinz_message";
  userId: string;
  user?: {
    userName: string;
    profilePic: string;
    tagline: string;
  };
  content?: string;
  timestamp: number;
  likeCount: number;
  commentCount: number;
  files?: Array<{ type: string; fileName: string; url: string; s3Key?: string }>;
  tags?: string[];
  hasAudio?: boolean;
  imageCount?: number;
  isLikedByUser?: boolean;
  degree?: number;
}

// Updated FeedMetrics to match Lambda response
export interface FeedMetrics {
  completedUsers: string[];
  seenItemIds: string[];
  lastFollowKey: string;
  lastFollowerKey: string;
  lastDegree2Key: string;
  currentDegree: number;
  totalUsersProcessed: number;
  stats: {
    total_items: number;
    users_processed: number;
    newly_completed_users: number;
    degree_distribution: {
      degree_1: number;
      degree_2: number;
    };
    items_by_type: {
      posts: number;
      reels: number;
      crinz_messages: number;
    };
  };
}

// Define proper types for the API response
interface ApiResponse {
  feedItems: FeedItem[];
  lastKey?: string;
  hasMore?: boolean;
  metrics?: FeedMetrics;
}

// Define proper type for the update function
type ItemUpdater = (currentItem: FeedItem) => FeedItem;

export const usePersonalizedData = () => {
  const { user } = useAuth();
  const { getItem, setItem } = useCache();
  const [content, setContent] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [metrics, setMetrics] = useState<FeedMetrics | null>(null);
  const isInitialMount = useRef(true);

  const updateContentItem = useCallback((contentId: string, updater: ItemUpdater) => {
    setContent(prev => prev.map(item =>
      item.id === contentId ? updater(item) : item
    ));
  }, []);

  // Update the fetchContent dependency array
  const fetchContent = useCallback(async (
    options: {
      limit?: number;
      lastKey?: string;
      isRefresh?: boolean;
      isLoadMore?: boolean;
    } = {}
  ) => {
    const {
      limit = 15,
      lastKey: lastKeyParam,
      isRefresh = false,
      isLoadMore = false
    } = options;

    // Don't fetch if no user or already loading (for initial/refresh)
    if (!user || (loading && !isLoadMore)) return;

    // Don't load more if no lastKey, no hasMore, or already loading more
    if (isLoadMore && (!lastKeyParam || !hasMore || loadingMore)) {
      devLog("[Load More] Skipped:", { lastKeyParam, hasMore, loadingMore });
      return;
    }

    // Cache logic - only for initial load, not for pagination or refresh
    if (!lastKeyParam && !isRefresh && !isLoadMore) {
      const cachedFeed = getItem<FeedItem[]>("personalized_feed_cache");
      const cachedState = getItem<{ lastKey: string | null; hasMore: boolean }>("feed_pagination_cache");

      if (cachedFeed && cachedFeed.length > 0) {
        devLog("[Feed Cache HIT] Using cached data, skipping API fetch");
        setContent(cachedFeed);
        if (cachedState) {
          setLastKey(cachedState.lastKey);
          setHasMore(cachedState.hasMore);
        }
        return;
      }
    }

    // Set appropriate loading state
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      devLog(`[API Request] ${isLoadMore ? 'Load More' : isRefresh ? 'Refresh' : 'Initial'}, limit: ${limit}, lastKey: ${lastKeyParam?.substring(0, 50)}...`);

      const res = await fetch(
        `${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.PERSONALIZATION}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.access_token}`,
          },
          body: JSON.stringify({
            limit: isLoadMore ? limit : undefined, // Send limit for pagination
            lastKey: lastKeyParam
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data: ApiResponse = await res.json();
      devLog(`[API Response] ${isLoadMore ? 'Load More' : 'Initial'}:`, {
        itemsCount: data.feedItems?.length,
        hasMore: data.hasMore,
        lastKeyPresent: !!data.lastKey,
        metrics: data.metrics?.stats
      });

      if (isLoadMore) {
        // Append for pagination
        setContent(prev => [...prev, ...data.feedItems]);
      } else {
        // Replace for initial/refresh
        setContent(data.feedItems);
        // Cache only initial load (not refresh, not pagination)
        if (!lastKeyParam && !isRefresh) {
          setItem("personalized_feed_cache", data.feedItems, 3600000); // 1 hour TTL
          setItem("feed_pagination_cache", {
            lastKey: data.lastKey || null,
            hasMore: data.hasMore ?? false
          }, 3600000);
        }
      }

      setLastKey(data.lastKey || null);
      setHasMore(data.hasMore ?? false);
      setMetrics(data.metrics || null);

    } catch (err) {
      devError("Fetch error:", err);
      // Reset loading states on error
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [user, loading, loadingMore, hasMore, getItem, setItem]); // ✅ REMOVED lastKey dependency

  // Fix the loadMore function to not depend on lastKey
  const loadMore = useCallback(() => {
    devLog("[Load More] Triggered:", { hasMore, lastKey, loading, loadingMore });

    if (!hasMore) {
      devLog("[Load More] No more content available");
      return;
    }

    if (!lastKey) {
      devLog("[Load More] No lastKey available");
      return;
    }

    if (loading || loadingMore) {
      devLog("[Load More] Already loading");
      return;
    }

    fetchContent({
      limit: 15,
      lastKey, // ✅ lastKey is available in the closure
      isLoadMore: true
    });
  }, [hasMore, lastKey, loading, loadingMore, fetchContent]); // ✅ Keep lastKey dependency here

  // Initial load on mount - fix the useEffect
  useEffect(() => {
    if (user && isInitialMount.current) {
      isInitialMount.current = false;
      fetchContent({ isRefresh: false });
    }
  }, [user, fetchContent]); // ✅ ADD fetchContent dependency

  const refresh = useCallback(() => {
    devLog("[Refresh] Manual refresh triggered");
    return fetchContent({ isRefresh: true });
  }, [fetchContent]);

  return {
    content,
    loading,
    loadingMore,
    lastKey,
    hasMore,
    metrics,
    fetchContent,
    refresh,
    loadMore,
    updateContentItem
  };
};