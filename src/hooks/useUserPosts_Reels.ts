import { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";

type FileItem = {
  fileName?: string;
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
};

// Cache store outside the hook - persists until page reload
const cache = new Map<string, Post[]>();

// Generate cache key based on parameters
const generateCacheKey = (type: "crinzpostsmeme" | "crinzpostsreels", userId?: string) => {
  return `${type}-${userId || 'current'}`;
};

export const useUserPosts = (type: "crinzpostsmeme" | "crinzpostsreels", userId?: string) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.access_token) {
      setLoading(false);
      return;
    }

    const cacheKey = generateCacheKey(type, userId);
    const cachedData = cache.get(cacheKey);

    // Return cached data if it exists
    if (cachedData) {
      console.log("📦 Using cached data for:", cacheKey);
      setPosts(cachedData);
      setLoading(false);
      return;
    }

    // Fetch new data only if not in cache
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const payload: any = { type };
        if (userId) {
          payload.userId = userId;
        }
        
        console.log("🔄 Fetching from userposts reels hook...", cacheKey);
        const res = await fetch(
          `${import.meta.env.VITE_BASE_API_URL}/fetchUserPostsAndReels`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.access_token}`,
          },
          body: JSON.stringify(payload),
        });
        
        const data = await res.json();
        console.log("✅ Fetched data for:", cacheKey, data.posts?.length || 0, "items");
        
        const postsData = data.posts || [];
        setPosts(postsData);
        
        // Cache the data indefinitely
        cache.set(cacheKey, postsData);
        console.log("💾 Cached data for:", cacheKey);
        
      } catch (e) {
        console.error("❌ Fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [type, user?.access_token, userId]); // Only refetch when these dependencies change

  return { posts, loading };
};