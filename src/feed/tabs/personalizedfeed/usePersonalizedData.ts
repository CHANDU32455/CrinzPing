// hooks/usePersonalizedData.ts
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "react-oidc-context";

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
}

export interface FeedMetrics {
  processedFollowees: string[];
  currentFolloweeBatch: string[];
  currentFolloweeIndex: number;
  lastFollowKey: any;
  processedGlobalUsers: string[];
  currentGlobalBatch: string[];
  currentGlobalIndex: number;
  lastGlobalKey: any;
  seenItemIds: string[];
  phase: "followees" | "global";
  partiallyProcessedUsers: Record<string, any>;
  stats: {
    total_items_processed: number;
    followees_processed: number;
    global_users_processed: number;
    posts_fetched: number;
    reels_fetched: number;
    crinz_fetched: number;
  };
}

export const usePersonalizedData = () => {
  const { user } = useAuth();
  const [content, setContent] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [metrics, setMetrics] = useState<FeedMetrics | null>(null);

    const updateContentItem = useCallback((contentId: string, updater: (currentItem: any) => any) => {
    setContent(prev => prev.map(item => 
      item.id === contentId ? updater(item) : item
    ));
  }, []);

  const fetchContent = useCallback(async (limit = 15, lastKeyParam?: string, isRefresh = false) => {
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
          body: JSON.stringify({ 
            limit, 
            lastKey: lastKeyParam 
          }),
        }
      );

      const data = await res.json();
      console.log("Personalized feed response:", data);
      
      if (!res.ok) {
        console.error("API Error:", data);
        return;
      }

      if (lastKeyParam && !isRefresh) {
        setContent(prev => [...prev, ...data.feedItems]);
      } else {
        setContent(data.feedItems);
      }

      setLastKey(data.lastKey || null);
      setHasMore(data.hasMore ?? false);
      setMetrics(data.metrics || null);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      fetchContent();
    }
  }, [user]);

  const refresh = useCallback(() => {
    return fetchContent(15, undefined, true);
  }, [fetchContent]);

  const loadMore = useCallback(() => {
    if (hasMore && lastKey && !loading) {
      fetchContent(15, lastKey, false);
    }
  }, [hasMore, lastKey, loading, fetchContent]);

  return { 
    content, 
    loading, 
    lastKey, 
    hasMore,
    metrics,
    fetchContent,
    refresh,
    loadMore,
    updateContentItem
  };   
};