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

export const useUserPosts = (type: "crinzpostsmeme" | "crinzpostsreels", userId?: string) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.access_token) return;

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const payload: any = { type };
        if (userId) {
          payload.userId = userId;
        }
        console.log("fetching from userposts reels hook... ");
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
        console.log("reels or posts data:", data);
        setPosts(data.posts || []);
      } catch (e) {
        console.error("fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [type, user?.access_token, userId]);

  return { posts, loading };
};