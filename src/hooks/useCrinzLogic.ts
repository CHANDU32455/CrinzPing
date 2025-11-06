import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "react-oidc-context";

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

      const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/getCrinz`, {
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

      // Cache with timestamp
      const cacheData = {
        ...data,
        cachedAt: Date.now()
      };
      localStorage.setItem("crinz_cache", JSON.stringify(cacheData));

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
  }, [auth.user?.access_token]);

  const toggleAutoMode = useCallback(() => {
    const updated = !autoMode;
    setAutoMode(updated);
    localStorage.setItem("crinz_auto_enabled", String(updated));

    if (updated) {
      // If enabling auto mode, do an immediate check
      const hour = new Date().getHours();
      lastHourRef.current = hour;
    }
  }, [autoMode]);

  const likeCrinz = useCallback(async (crinzId: string): Promise<boolean> => {
    if (!auth.user?.access_token) return false;

    try {
      const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/likeCrinz`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.user.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ crinzId }),
      });

      if (res.ok) {
        // Optimistically update the UI
        setCrinzData(prev => prev ? {
          ...prev,
          likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1,
          isLiked: !prev.isLiked
        } : null);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Like error:", err);
      return false;
    }
  }, [auth.user?.access_token]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if cache is stale (older than 1 hour)
  const isCacheStale = useCallback((cachedAt: number) => {
    return Date.now() - cachedAt > 60 * 60 * 1000; // 1 hour
  }, []);

  // Load cached roast when user logs in
  useEffect(() => {
    if (auth.isAuthenticated) {
      const cached = localStorage.getItem("crinz_cache");
      const auto = localStorage.getItem("crinz_auto_enabled");

      if (cached) {
        try {
          const parsed = JSON.parse(cached);

          // Check if cache is stale
          if (parsed.cachedAt && !isCacheStale(parsed.cachedAt)) {
            setCrinzData(parsed);
            setShowTile(true);
          } else {
            // Cache is stale, fetch new data
            getCrinzMessage();
          }
        } catch {
          localStorage.removeItem("crinz_cache");
          getCrinzMessage();
        }
      } else {
        // No cache, fetch immediately
        getCrinzMessage();
      }

      if (auto === "false") setAutoMode(false);
    } else {
      // User logged out, clear state
      setCrinzData(null);
      setShowTile(false);
      setError(null);
    }
  }, [auth.isAuthenticated, getCrinzMessage, isCacheStale]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
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
  };
}