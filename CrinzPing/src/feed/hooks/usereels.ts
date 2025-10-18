import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "react-oidc-context";

export interface Reel {
  postId: string;
  userId: string;
  caption: string;
  tags: string[];
  timestamp: number;
  likes: number;
  comments: number;
  visibility: string;
  files: { s3Key: string; fileName: string; type: string; presignedUrl: string }[];
}

export const useReels = (searchTerm?: string) => {
  const auth = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [lastKey, setLastKey] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchReels = useCallback(
    async (append = false) => {
      if (!auth.user?.access_token) return;

      setLoading(true);
      setError(null);
      try {
        console.log("fetching reels..")
        const res = await axios.post(
          `${import.meta.env.VITE_BASE_API_URL}/reelsFetcher`,
          { limit: 10, lastKey: append ? lastKey : undefined, searchTerm },
          { headers: { Authorization: `Bearer ${auth.user.access_token}` } }
        );

        const fetchedReels: Reel[] = res.data.reels || [];
        console.log("fetched reels", fetchedReels);
        setReels(prev => (append ? [...prev, ...fetchedReels] : fetchedReels));
        setLastKey(res.data.lastEvaluatedKey);
        setHasMore(!!res.data.lastEvaluatedKey);
      } catch (err: any) {
        setError(err.message || "Failed to fetch reels");
      } finally {
        setLoading(false);
      }
    },
    [auth.user?.access_token, lastKey, searchTerm]
  );

  const loadMore = useCallback(() => {
    if (hasMore && !loading) fetchReels(true);
  }, [hasMore, loading, fetchReels]);

  const refresh = useCallback(() => {
    setLastKey(null);
    setHasMore(true);
    fetchReels(false);
  }, [fetchReels]);

  useEffect(() => {
    refresh();
  }, [searchTerm, refresh]);

  return { reels, loading, error, hasMore, loadMore, refresh };
};
