import { useState, useEffect, useCallback, useRef } from "react";

export interface Comment {
  commentId: string;
  crinzId: string;
  comment: string;
  timestamp: number;
  userId: string;
}

export function useComments(crinzId: string | null, accessToken: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  const fetchComments = useCallback(
    async (isInitial = false) => {
      if (!accessToken) {
        setError("Authorization token missing");
        return;
      }
      if (loading) return;
      if (!hasMore && !isInitial) return;
      if (!crinzId) return;
      if (retryCount.current >= MAX_RETRIES) {
        setError("Failed to fetch comments after multiple attempts");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const bodyPayload: any = { crinzId, limit: 15 };
        if (!isInitial && lastKey) bodyPayload.lastKey = lastKey;

        const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/getPostComments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(bodyPayload),
        });

        if (!res.ok) {
          if (res.status === 401) {
            retryCount.current++;
            throw new Error("Unauthorized access");
          } else {
            throw new Error(`Failed to fetch comments: ${res.status}`);
          }
        }

        const data = await res.json();

        const fetchedComments: Comment[] = data.comments || [];
        console.log("Fetched comments:", fetchedComments); // <-- log here

        setComments((prev) =>
          isInitial ? fetchedComments : [...prev, ...fetchedComments]
        );
        setLastKey(data.lastKey || null);
        setHasMore(!!data.lastKey);

        retryCount.current = 0; // reset on success
      } catch (err: any) {
        setError(err.message || "Error fetching comments");
      } finally {
        setLoading(false);
      }
    },
    [crinzId, lastKey, loading, hasMore, accessToken]
  );

  useEffect(() => {
    setComments([]);
    setLastKey(null);
    setHasMore(true);
    retryCount.current = 0;
    if (crinzId && accessToken) fetchComments(true);
  }, [crinzId, accessToken, fetchComments]);

  return { comments, loading, error, fetchComments, hasMore };
}
