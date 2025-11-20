import { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";

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

export const useUserPosts = (type: "crinzpostsmeme" | "crinzpostsreels", userId?: string) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastKey, setLastKey] = useState<string | null>(null);

  const fetchData = async (isLoadMore = false) => {
    if (!user?.access_token) return;

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
      fetchData(true);
    }
  };

  const refreshPosts = () => {
    setPosts([]);
    setUserDetails(null);
    setLastKey(null);
    setHasMore(true);
    fetchData(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchData(false).finally(() => setLoading(false));
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