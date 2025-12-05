import { useState, useEffect, useCallback } from "react";
import { useAuth } from "react-oidc-context";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

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

type FetchPayload = {
  type: "crinzpostsmeme" | "crinzpostsreels";
  limit: number;
  lastKey?: string;
  userId?: string;
};

export const useUserPosts = (type: "crinzpostsmeme" | "crinzpostsreels", userId?: string) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastKey, setLastKey] = useState<string | null>(null);

  const fetchData = useCallback(async (isLoadMore = false) => {
    if (!user?.access_token) return;

    const payload: FetchPayload = {
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
      const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.FETCH_USER_POSTS_AND_REELS}`, {
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
        }
        setUserDetails(data.userDetails || null);
        setLastKey(data.lastKey || null);
        setHasMore(data.hasMore === true);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    } finally {
      setLoading(false);
    }
  }, [type, user?.access_token, userId, lastKey]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchData(true);
    }
  }, [hasMore, loading, fetchData]);

  const refreshPosts = useCallback(() => {
    setPosts([]);
    setUserDetails(null);
    setLastKey(null);
    setHasMore(true);
    setLoading(true);
    fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    setLoading(true);
    fetchData(false);
  }, [fetchData]);

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