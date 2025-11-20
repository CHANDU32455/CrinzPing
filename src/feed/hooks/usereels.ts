import { useState, useEffect, useCallback, useRef } from "react";
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
  isLikedByUser?: boolean; // ✅ ADDED: Optional field
}

export const useReels = (searchTerm?: string) => {
  const auth = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [lastKey, setLastKey] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Use ref for the flag instead of state
  const isFetchingRef = useRef(false);

  const fetchReels = useCallback(
    async (append = false) => {
      // Prevent concurrent requests
      if (!auth.user?.access_token || isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      try {
        console.log("🔄 Fetching reels", { append, searchTerm });
        
        const res = await axios.post(
          `${import.meta.env.VITE_BASE_API_URL}/reelsFetcher`,
          { 
            limit: 10, 
            lastKey: append ? lastKey : undefined, 
            searchTerm 
          },
          { 
            headers: { Authorization: `Bearer ${auth.user.access_token}` },
            timeout: 10000
          }
        );

        const fetchedReels: Reel[] = (res.data.reels || []).map((reel: any) => ({
          ...reel,
          isLikedByUser: reel.isLikedByUser || false // ✅ ADDED: Ensure this field exists
        }));
        
        console.log("✅ Reels fetched:", fetchedReels);

        setReels(prev => append ? [...prev, ...fetchedReels] : fetchedReels);
        setLastKey(res.data.lastEvaluatedKey);
        setHasMore(!!res.data.lastEvaluatedKey);
        
      } catch (err: any) {
        console.error("❌ Fetch error:", err);
        setError(err.message || "Failed to fetch reels");
        
        // Reset state on error to allow retry
        if (!append) {
          setReels([]);
          setHasMore(true);
        }
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [auth.user?.access_token, lastKey, searchTerm]
  );

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchReels(true);
    }
  }, [hasMore, loading, fetchReels]);

  const refresh = useCallback(() => {
    setLastKey(null);
    setHasMore(true);
    fetchReels(false);
  }, [fetchReels]);

  // Simple useEffect - only run when searchTerm changes
  useEffect(() => {
    refresh();
  }, [searchTerm]);

  return { 
    reels, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    refresh,
    retry: refresh 
  };
};