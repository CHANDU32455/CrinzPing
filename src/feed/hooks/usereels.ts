import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useAuth } from "react-oidc-context";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";

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
  isLikedByUser?: boolean;
  user?: {
    userName: string;
    profilePic: string;
    tagline: string;
  };
}

interface ReelApiResponse {
  postId: string;
  userId: string;
  caption: string;
  tags: string[];
  timestamp: number;
  likes: number;
  comments: number;
  visibility: string;
  files: { s3Key: string; fileName: string; type: string; presignedUrl: string }[];
  isLikedByUser?: boolean;
  user?: {
    userName: string;
    profilePic: string;
    tagline: string;
  };
}

interface ApiResponse {
  reels: ReelApiResponse[];
  lastEvaluatedKey?: Record<string, unknown> | null;
}

export const useReels = (searchTerm?: string) => {
  const auth = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [lastKey, setLastKey] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

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
        console.log("🔄 Fetching reels", { append, searchTerm, lastKey });

        const res = await axios.post<ApiResponse>(
          `${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.REELS_FETCHER}`,
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

        const fetchedReels: Reel[] = (res.data.reels || []).map((reel: ReelApiResponse) => ({
          ...reel,
          isLikedByUser: reel.isLikedByUser || false,
          user: reel.user || undefined
        }));

        console.log("✅ Reels fetched:", fetchedReels.length, "items");

        setReels(prev => append ? [...prev, ...fetchedReels] : fetchedReels);
        setLastKey(res.data.lastEvaluatedKey || null);
        setHasMore(!!res.data.lastEvaluatedKey);

      } catch (err: unknown) {
        console.error("❌ Fetch error:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch reels";
        setError(errorMessage);

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
    // hasMore is NOT used in fetchReels, so it's not needed in dependencies
  );

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchReels(true);
    }
  }, [hasMore, loading, fetchReels]); // hasMore is properly included here

  const refresh = useCallback(() => {
    console.log("🔄 Refreshing reels");
    setLastKey(null);
    setHasMore(true);
    setHasInitialized(false);
    // Don't call fetchReels directly - let the useEffect handle it
  }, []); // Empty dependencies since we're only setting state

  // ✅ Initialize once when auth is ready and searchTerm changes
  useEffect(() => {
    // Only run if we have auth and haven't initialized yet
    if (auth.user?.access_token && !hasInitialized) {
      console.log("🚀 Initializing reels fetch");
      setHasInitialized(true);
      fetchReels(false);
    }
  }, [auth.user?.access_token, hasInitialized, fetchReels]);

  // ✅ Handle search term changes without infinite loop
  useEffect(() => {
    if (auth.user?.access_token) {
      console.log("🔍 Search term changed, refreshing reels");
      setReels([]);
      setLastKey(null);
      setHasMore(true);
      setHasInitialized(false);
      // The above state changes will trigger the first useEffect
    }
  }, [searchTerm, auth.user?.access_token]);

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