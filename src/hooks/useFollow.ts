import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from 'react-oidc-context';
import { API_ENDPOINTS } from "../constants/apiEndpoints";

interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  isFollowing: boolean;
  bio?: string;
  postCount: number;
}

// Define proper types for pagination keys
interface PaginationKey {
  [key: string]: unknown;
}

// Simple global cache - add this at the top
const cache = {
  stats: new Map<string, FollowStats>(),
  followers: new Map<string, User[]>(),
  following: new Map<string, User[]>(),
};

const useFollow = (userId?: string) => {
  const auth = useAuth();
  const accessToken = auth.user?.access_token;
  const currentUserId = auth.user?.profile.sub || localStorage.getItem("sub");
  const [stats, setStats] = useState<FollowStats>({
    followersCount: 0,
    followingCount: 0,
    isFollowing: false
  });
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [followersLastKey, setFollowersLastKey] = useState<PaginationKey | null>(null);
  const [followingLastKey, setFollowingLastKey] = useState<PaginationKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const QUERY_HANDLER = `${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.FOLLOW_QUERY_HANDLER}`;
  const FOLLOW_UNFOLLOW_POINT = `${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.FOLLOW_HANDLER}`;

  // cache refs
  const statsFetched = useRef(false);
  const followersFetched = useRef(false);
  const followingFetched = useRef(false);

  const fetchFollowStats = useCallback(async (force = false) => {
    if (!userId) return;

    // Check cache first - ADDED CACHE LOGIC
    if (cache.stats.has(userId) && !force) {
      console.log("[useFollow] Using cached stats for:", userId);
      setStats(cache.stats.get(userId)!);
      statsFetched.current = true;
      return;
    }

    if (statsFetched.current && !force) {
      return;
    }

    console.log("[useFollow] Fetching stats from API...");
    setLoading(true);
    setError(null);
    try {
      const url = `${QUERY_HANDLER}?type=stats&userId=${userId}&currentUserId=${currentUserId}`;
      console.log(`[useFollow] GET request for stats`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        }
      });

      if (!response.ok) throw new Error('Failed to fetch follow stats');
      const data = await response.json();
      // Update cache - ADDED CACHE LOGIC
      cache.stats.set(userId, data);

      setStats(data);
      statsFetched.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error("Error fetching follow stats:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, currentUserId, accessToken, QUERY_HANDLER]);

  // Add refreshStats function - useCallback to prevent unnecessary re-renders
  const refreshStats = useCallback(async () => {
    if (!userId) return;

    console.log("[useFollow] Force refreshing stats...");
    // Clear cache for this user to force fresh fetch
    cache.stats.delete(userId);
    statsFetched.current = false;
    await fetchFollowStats(true);
  }, [userId, fetchFollowStats]);

  const fetchFollowers = useCallback(async (append = false, force = false) => {
    if (!userId) return;

    // cache check (only if not paginating and not force reloading)
    if (!append && cache.followers.has(userId) && !force) {
      console.log("[useFollow] Using cached followers for:", userId);
      setFollowersList(cache.followers.get(userId)!);
      followersFetched.current = true;
      return;
    }

    if (followersFetched.current && !append && !force) {
      return;
    }

    console.log("[useFollow] Fetching followers list from API...");
    setLoading(true);
    setError(null);

    try {
      let url = `${QUERY_HANDLER}?type=followers&userId=${userId}&currentUserId=${currentUserId}&limit=10`;

      // add pagination key if present
      if (followersLastKey) {
        url += `&lastKey=${encodeURIComponent(JSON.stringify(followersLastKey))}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch followers");
      const data = await response.json();

      const followers = data.followers || [];
      const newList = append ? [...followersList, ...followers] : followers;

      // update cache only when not appending (first page or force refresh)
      if (!append) {
        cache.followers.set(userId, newList);
      }

      setFollowersList(newList);
      setFollowersLastKey(data.lastKey || null);

      followersFetched.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching followers:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, currentUserId, accessToken, followersLastKey, followersList, QUERY_HANDLER]);

  const fetchFollowing = useCallback(async (append = false, force = false) => {
    if (!userId) return;

    // cache check (only if not paginating and not force reloading)
    if (!append && cache.following.has(userId) && !force) {
      console.log("[useFollow] Using cached following for:", userId);
      setFollowingList(cache.following.get(userId)!);
      followingFetched.current = true;
      return;
    }

    if (followingFetched.current && !append && !force) {
      return;
    }

    console.log("[useFollow] Fetching following list from API...");
    setLoading(true);
    setError(null);

    try {
      let url = `${QUERY_HANDLER}?type=following&userId=${userId}&currentUserId=${currentUserId}&limit=10`;

      // add pagination key if present
      if (followingLastKey) {
        url += `&lastKey=${encodeURIComponent(JSON.stringify(followingLastKey))}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch following");
      const data = await response.json();

      const following = data.following || [];
      const newList = append ? [...followingList, ...following] : following;

      // update cache only when not appending (first page or force refresh)
      if (!append) {
        cache.following.set(userId, newList);
      }

      setFollowingList(newList);
      setFollowingLastKey(data.lastKey || null);

      console.log("[useFollow] followingList:", newList);

      followingFetched.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching following:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, currentUserId, accessToken, followingLastKey, followingList, QUERY_HANDLER]);

  const doToggle = useCallback(async (targetUserId: string, action: "follow" | "unfollow") => {
    setError(null);
    try {
      console.log("[useFollow] Toggle follow request:", {
        followerId: currentUserId,
        targetId: targetUserId,
        action,
      });

      const response = await fetch(FOLLOW_UNFOLLOW_POINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          followerId: currentUserId,
          targetId: targetUserId,
          action,
        }),
      });

      const responseText = await response.text();
      console.log("[useFollow] Response status:", response.status);

      if (!response.ok) {
        let errorMessage = "Failed to toggle follow status";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          if (responseText) errorMessage += `: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      const responseData = JSON.parse(responseText);
      console.log("[useFollow] response for toggling", responseData);
      console.log(`[useFollow] Toggle follow success → ${action} user ${targetUserId}`);

      if (responseData.success) {
        // update state
        setStats(prev => {
          let followersCount = prev.followersCount;
          if (action === "follow") followersCount++;
          else if (action === "unfollow" && followersCount > 0) followersCount--;

          return {
            ...prev,
            followersCount,
            isFollowing: action === "follow"
          };
        });
        const prev = cache.stats.get(userId!) || stats;

        cache.stats.set(userId!, {
          ...prev,
          followersCount:
            action === "follow"
              ? prev.followersCount + 1
              : Math.max(0, prev.followersCount - 1),
          isFollowing: action === "follow",
        });

        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error toggling follow:", err);
      return false;
    }
  }, [currentUserId, accessToken, userId, stats, FOLLOW_UNFOLLOW_POINT]);

  // profile usage (depends on stats.isFollowing)
  const toggleFollow = useCallback(async (targetUserId: string) => {
    const action = stats.isFollowing ? "unfollow" : "follow";
    return doToggle(targetUserId, action);
  }, [stats.isFollowing, doToggle]);

  // list usage (explicit flag)
  const toggleFollowDirect = useCallback(async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    const action = isCurrentlyFollowing ? "unfollow" : "follow";
    return doToggle(targetUserId, action);
  }, [doToggle]);

  useEffect(() => {
    if (!userId || !currentUserId) {
      console.log("[useFollow] Waiting for auth to load...");
      return;
    }

    fetchFollowStats(false); // ✅ Load from cache if available
  }, [userId, currentUserId, fetchFollowStats]);

  return {
    stats,
    loading,
    error,
    followersList,
    followingList,
    followersLastKey,
    followingLastKey,
    setFollowersList,
    setFollowingList,

    fetchFollowStats,
    fetchFollowers,
    fetchFollowing,
    refreshStats,
    toggleFollow,
    toggleFollowDirect
  };
};

export default useFollow;