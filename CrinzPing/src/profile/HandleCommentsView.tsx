// HandleCommentsView.tsx
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "react-oidc-context";
import "./HandleCommentsView.css";

const COMMENTS_API_URL = import.meta.env.VITE_GET_COMMENTS_API_URL;

interface Comment {
    commentId: string;
    crinzId: string;
    userId: string;
    comment: string;
    timestamp: number;
    userDisplayName?: string;
}

interface HandleCommentsViewProps {
    postId: string;
    initialCommentCount: number;
    comments: Comment[]; // optimistic comments from ProfileMorePosts
    onClose: () => void;
    onAddComment: (postId: string, commentText: string) => void;
    onDeleteComment: (postId: string, commentId: string) => void;
    currentUserId: string | undefined;
}

export default function HandleCommentsView({
    postId,
    initialCommentCount,
    comments: tempComments,
    onClose,
    onAddComment,
    onDeleteComment,
    currentUserId,
}: HandleCommentsViewProps) {
    const auth = useAuth();

    const [serverComments, setServerComments] = useState<Comment[]>([]);
    const [lastKey, setLastKey] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newComment, setNewComment] = useState("");
    const [hasFetched, setHasFetched] = useState(false);

    // Fetch comments from API
    const fetchComments = useCallback(
        async (loadMore = false) => {
            if (loading) return;
            if (!auth.user) {
                setError("You must be logged in to view comments.");
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await fetch(COMMENTS_API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${auth.user.id_token}`,
                    },
                    body: JSON.stringify({
                        crinzId: postId,
                        limit: 15,
                        lastKey: loadMore ? lastKey : undefined,
                    }),
                });

                if (!res.ok) throw new Error(`Failed to fetch comments (${res.status})`);
                const data = await res.json();
                console.log("fetched live comments: ", data);

                const fetched = (data.comments || []) as Comment[];

                if (loadMore) {
                    // For load more, just append the new comments
                    setServerComments(prev => [...prev, ...fetched]);
                } else {
                    // For initial fetch, replace all server comments
                    setServerComments(fetched);
                }

                setLastKey(data.lastKey || null);
                setHasFetched(true);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        },
        [auth.user, postId, lastKey, loading]
    );

    useEffect(() => {
        // Fetch only if it is initial mount and post has comments
        if (!hasFetched && postId && initialCommentCount > 0) {
            fetchComments();
        }
    }, [postId, hasFetched, fetchComments, initialCommentCount]);


    // Merge optimistic comments with server comments, removing any conflicts
    const mergedComments = useCallback(() => {
        // Filter out any server comments that have been locally deleted
        const deletedCommentIds = new Set(
            tempComments
                .filter(c => c.commentId.startsWith('deleted-'))
                .map(c => c.commentId.replace('deleted-', ''))
        );

        const filteredServerComments = serverComments.filter(
            serverComment => !deletedCommentIds.has(serverComment.commentId)
        );

        // Get only the locally added comments (not deleted ones)
        const addedComments = tempComments.filter(
            tempComment => !tempComment.commentId.startsWith('deleted-')
        );

        // Merge and sort by timestamp (newest first)
        return [...addedComments, ...filteredServerComments].sort(
            (a, b) => b.timestamp - a.timestamp
        );
    }, [tempComments, serverComments]);

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        onAddComment(postId, newComment.trim());
        setNewComment("");
    };

    const handleDeleteComment = (commentId: string) => {
        onDeleteComment(postId, commentId);
    };

    const toDateFromAny = (ts: unknown): Date | null => {
        if (ts == null) return null;

        // DynamoDB attribute map? e.g. { N: "1754638218610" } or { S: "1754638218610" }
        if (typeof ts === "object") {
            const any = ts as any;
            const raw = any?.N ?? any?.S;
            if (raw != null) {
                const n = Number(raw);
                if (!Number.isFinite(n)) return null;
                const ms = n < 1e12 ? n * 1000 : n; // seconds → ms
                return new Date(ms);
            }
            return null;
        }

        // number or string
        const n = Number(ts);
        if (!Number.isFinite(n)) return null;
        const ms = n < 1e12 ? n * 1000 : n; // seconds → ms
        return new Date(ms);
    };

    return (
        <div className="comments-modal">
            <div className="comments-header">
                <h3>Comments ({initialCommentCount})</h3>
                <button onClick={onClose}>✖ Close</button>
            </div>

            <div className="comments-input">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleAddComment();
                        }
                    }}
                />
                <button onClick={handleAddComment} disabled={!auth.user || !newComment.trim()}>
                    Post
                </button>
            </div>

            {error && <div className="error">⚠ {error}</div>}

            <div className="comments-list">
                {mergedComments().length === 0 && !loading && (
                    <p className="no-comments">No comments yet.</p>
                )}
                {mergedComments().map((c) => (
                    <div key={c.commentId} className="comment-item">
                        <div className="comment-header">
                            <span className="comment-user">
                                {c.userDisplayName || `user-${c.userId.substring(0, 8)}`}
                            </span>
                            <span className="comment-time">
                                {(() => {
                                    const d = toDateFromAny(c.timestamp);
                                    return d ? d.toLocaleString() : "—";
                                })()}
                            </span>
                        </div>
                        <p className="comment-text">{c.comment}</p>
                        {c.userId === currentUserId && (
                            <button
                                className="delete-comment"
                                onClick={() => handleDeleteComment(c.commentId)}
                                title="Delete comment"
                            >
                                🗑 Delete
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {lastKey && !loading && (
                <div className="load-more">
                    <button onClick={() => fetchComments(true)}>Load more</button>
                </div>
            )}

            {loading && <p className="loading">Loading...</p>}
        </div>
    );
}