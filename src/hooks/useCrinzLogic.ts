import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "react-oidc-context";
import { useCache } from "../context/CacheContext";
import { contentManager } from "../utils/Posts_Reels_Stats_Syncer";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export interface User {
  userName: string;
  tagline: string;
  profilePic: string;
}

export interface CrinzResponse {
  crinzId: string;
  userId: string;
  userName: string;
  category: string;
  message: string;
  timestamp: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  user: User;
}

export function useCrinzLogic() {
  const auth = useAuth();
  const { getItem, setItem } = useCache();

  const [crinzData, setCrinzData] = useState<CrinzResponse | null>(null);
  const [showTile, setShowTile] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lastHourRef = useRef<number | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getCrinzMessage = useCallback(async (): Promise<CrinzResponse | null> => {
    try {
      setIsFetching(true);
      setError(null);

      const token = auth.user?.access_token;
      if (!token) {
        throw new Error("No authentication token available");
      }

      const userDetails = JSON.parse(localStorage.getItem("user_details") || "{}");
      const categories = userDetails?.categories || [];

      const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.GET_CRINZ}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categories }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Authentication failed - please log in again");
        } else if (res.status === 404) {
          throw new Error("No crinz available for your categories");
        } else {
          throw new Error(`HTTP error ${res.status}`);
        }
      }

      const data: CrinzResponse = await res.json();

      // Validate required fields
      if (!data.crinzId || !data.message || !data.userId) {
        throw new Error("Invalid response data from server");
      }

      console.log("Fetched Crinz data:", data);

      setCrinzData(data);
      setShowTile(true);

      // Cache with timestamp (using CacheContext)
      setItem("crinz_cache", data, 3600000);

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch crinz";
      console.error("Fetch error:", err);
      setError(errorMessage);

      // Show error temporarily
      setTimeout(() => setError(null), 5000);

      return null;
    } finally {
      setIsFetching(false);
    }
  }, [auth.user?.access_token, setItem]);

  const toggleAutoMode = useCallback(() => {
    const updated = !autoMode;
    setAutoMode(updated);
    setItem("crinz_auto_enabled", updated, 30 * 24 * 60 * 60 * 1000);

    if (updated) {
      const hour = new Date().getHours();
      lastHourRef.current = hour;
    }
  }, [autoMode, setItem]);

  const updateCrinzCache = useCallback((updatedData: CrinzResponse) => {
    setCrinzData(updatedData);
    setItem("crinz_cache", updatedData, 3600000);
  }, [setItem]);

  const likeCrinz = useCallback((crinzId: string) => {
    if (!auth.isAuthenticated || !auth.user?.profile?.sub || !crinzData) return;

    const userId = auth.user.profile.sub;
    const isLiked = crinzData.isLiked;

    // Use contentManager for syncing
    contentManager.likeContent(crinzId, 'crinz_message', userId, isLiked);

    // Optimistic update local state
    const newLikeCount = isLiked ? Math.max(0, crinzData.likeCount - 1) : crinzData.likeCount + 1;
    const newIsLiked = !isLiked;

    const updated = {
      ...crinzData,
      isLiked: newIsLiked,
      likeCount: newLikeCount
    };

    setCrinzData(updated);
    updateCrinzCache(updated);
  }, [auth.isAuthenticated, auth.user, crinzData, updateCrinzCache]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load cached roast when user logs in
  useEffect(() => {
    if (auth.isAuthenticated) {
      const cached = getItem<CrinzResponse>("crinz_cache");
      const auto = getItem<boolean>("crinz_auto_enabled");

      if (cached) {
        setCrinzData(cached);
        setShowTile(true);
      } else {
        // No cache or expired, fetch immediately
        getCrinzMessage();
      }

      if (auto === false) setAutoMode(false);
    } else {
      // User logged out, clear state
      setCrinzData(null);
      setShowTile(false);
      setError(null);
    }
  }, [auth.isAuthenticated, getCrinzMessage, getItem]);

  // Auto fetch at 6/12/18 hrs with improved logic
  useEffect(() => {
    const checkAndFetch = () => {
      if (!autoMode || !auth.isAuthenticated || isFetching) return;

      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const targets = [6, 12, 18];

      // Only fetch at the start of the hour (minute 0-1) to avoid multiple fetches
      if (targets.includes(hour) && minute <= 1 && lastHourRef.current !== hour) {
        console.log(`Auto-fetching crinz for hour ${hour}`);
        getCrinzMessage();
        lastHourRef.current = hour;
      }
    };

    // Check immediately and then every minute
    checkAndFetch();
    const interval = setInterval(checkAndFetch, 60000);

    return () => clearInterval(interval);
  }, [autoMode, auth.isAuthenticated, isFetching, getCrinzMessage]);

  // Cleanup on unmount - Fixed version
  useEffect(() => {
    // Capture the current ref value
    const currentFetchTimeout = fetchTimeoutRef.current;

    return () => {
      if (currentFetchTimeout) {
        clearTimeout(currentFetchTimeout);
      }
    };
  }, []);

  return {
    auth,
    crinzData,
    showTile,
    isFetching,
    autoMode,
    error,
    toggleAutoMode,
    getCrinzMessage,
    likeCrinz,
    clearError,
    updateCrinzCache,
  };
}