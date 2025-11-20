import { useState, useEffect, useCallback } from "react";
import { usePendingActions } from "../utils/usePendingActions";
import syncBatchActions from "../hooks/useBatchSync";

// Interfaces (keep synced with CrinzFeed)
interface Comment {
    commentId: string;
    crinzId: string;
    comment: string;
    timestamp: number;
    userId: string;
}

interface Post {
    crinzId: string;
    userName: string;
    message: string;
    timestamp: string | number;
    likeCount: number;
    commentCount: number;
    tags?: string[];
    isLiked?: boolean;
}

export function useCrinzActions(
    crinzPosts: Post[],
    currentUserId: string,
    fetchMessages: (refresh?: boolean) => Promise<void>
) {
    const {
        pendingActions,
        hydrated,
        addAction,
        removeAction,
        replaceActions,
        createAction,
        clearActions,
    } = usePendingActions();

    // Local comments cache + fetched posts tracking
    const [comments, setComments] = useState<Record<string, Comment[]>>({});
    const [fetchedCommentPosts, setFetchedCommentPosts] = useState<Set<string>>(new Set());

    // Derived state
    const [likes, setLikes] = useState<Record<string, boolean>>({});
    const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
    const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

    // Generate temp id helper
    const generateTempId = useCallback(() => `temp-${crypto.randomUUID()}`, []);

    // Recalculate likes, comments, counts on any change in pendingActions, hydrated, posts, or comments cache
    useEffect(() => {
        if (!hydrated) return;

        const derivedLikes: Record<string, boolean> = {};
        const derivedLikeCounts: Record<string, number> = {};
        const derivedCommentCounts: Record<string, number> = {};

        crinzPosts.forEach(post => {
            derivedLikes[post.crinzId] = !!post.isLiked;
            derivedLikeCounts[post.crinzId] = post.likeCount || 0;
            derivedCommentCounts[post.crinzId] = post.commentCount || 0;
        });

        // Apply pending actions on top of backend data
        pendingActions.forEach(action => {
            switch (action.type) {
                case "like":
                    derivedLikes[action.crinzId] = true;
                    derivedLikeCounts[action.crinzId] = (derivedLikeCounts[action.crinzId] || 0) + 1;
                    break;
                case "unlike":
                    derivedLikes[action.crinzId] = false;
                    derivedLikeCounts[action.crinzId] = Math.max(0, (derivedLikeCounts[action.crinzId] || 1) - 1);
                    break;
                case "add_comment":
                    derivedCommentCounts[action.crinzId] = (derivedCommentCounts[action.crinzId] || 0) + 1;
                    break;
                case "remove_comment":
                    derivedCommentCounts[action.crinzId] = Math.max(0, (derivedCommentCounts[action.crinzId] || 1) - 1);
                    break;
            }
        });

        setLikes(derivedLikes);
        setLikeCounts(derivedLikeCounts);
        setCommentCounts(derivedCommentCounts);
        // no setComments here to avoid infinite loop
    }, [pendingActions, hydrated, currentUserId, crinzPosts, generateTempId]);


    // Fetch comments for a post (used by UI)
    const fetchCommentsForPost = useCallback(
        async (crinzId: string, userAccessToken: string) => {
            if (fetchedCommentPosts.has(crinzId)) return; // avoid duplicate fetches

            try {
                const res = await fetch(import.meta.env.VITE_GET_COMMENTS_API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${userAccessToken}`,
                    },
                    body: JSON.stringify({ crinzId, limit: 15 }),
                });
                if (!res.ok) throw new Error(`Failed to fetch comments: ${res.status}`);
                const data = await res.json();

                setComments(prev => ({
                    ...prev,
                    [crinzId]: data.comments || [],
                }));

                setFetchedCommentPosts(prev => new Set(prev).add(crinzId));
            } catch (err) {
                console.error("Error fetching comments for post:", crinzId, err);
            }
        },
        [fetchedCommentPosts]
    );

    // Combine backend fetched + pending adds - pending removes for comments
    const getCombinedComments = useCallback(
        (crinzId: string) => {
            const fetchedComments = comments[crinzId] || [];

            const pendingAddedComments = pendingActions
                .filter(a => a.type === "add_comment" && a.crinzId === crinzId)
                .map(a => ({
                    commentId: a.commentId!,
                    crinzId: a.crinzId,
                    comment: a.payload || "",
                    timestamp: a.timestamp,
                    userId: currentUserId,
                }));

            const pendingRemovedCommentIds = new Set(
                pendingActions
                    .filter(a => a.type === "remove_comment" && a.crinzId === crinzId)
                    .map(a => a.payload)
            );

            const combined = [...fetchedComments, ...pendingAddedComments].filter(
                c => !pendingRemovedCommentIds.has(c.commentId)
            );

            // Remove duplicates (keep first)
            const combinedUnique = combined.filter(
                (comment, index, self) =>
                    index === self.findIndex(c => c.commentId === comment.commentId)
            );

            combinedUnique.sort((a, b) => a.timestamp - b.timestamp);

            return combinedUnique;
        },
        [comments, pendingActions, currentUserId]
    );

    // Like/unlike handler
    const handleLike = useCallback(
        (crinzId: string) => {
            const existingAction = pendingActions.find(
                a => (a.type === "like" || a.type === "unlike") && a.crinzId === crinzId
            );

            let currentlyLiked: boolean;
            if (existingAction) {
                currentlyLiked = existingAction.type === "like";
            } else {
                const post = crinzPosts.find(p => p.crinzId === crinzId);
                currentlyLiked = post?.isLiked ?? false;
            }

            if (existingAction) {
                removeAction(a => a.crinzId === crinzId && (a.type === "like" || a.type === "unlike"));
            } else {
                addAction(createAction(currentlyLiked ? "unlike" : "like", crinzId));
            }
        },
        [pendingActions, crinzPosts, addAction, removeAction, createAction]
    );

    // Add comment handler
    const handleAddComment = useCallback(
        (crinzId: string, newComment: string) => {
            const newCommentId = generateTempId();

            // Check for duplicates
            const alreadyExists = pendingActions.some(
                a => a.type === "add_comment" && a.commentId === newCommentId
            );
            if (alreadyExists) {
                console.warn("Attempted to add duplicate commentId:", newCommentId);
                return;
            }

            addAction(createAction("add_comment", crinzId, newComment, newCommentId));
        },
        [pendingActions, addAction, createAction, generateTempId]
    );

    // Remove comment handler
    const handleRemoveComment = useCallback(
        (crinzId: string, commentId: string) => {
            const addIndex = pendingActions.findIndex(
                a => a.type === "add_comment" && a.crinzId === crinzId && a.commentId === commentId
            );

            if (addIndex !== -1) {
                // Neutralize the pending add, remove from queue
                const updated = [...pendingActions];
                updated.splice(addIndex, 1);
                replaceActions(updated);

                // Remove from comments cache immediately
                setComments(prev => {
                    const postComments = prev[crinzId] || [];
                    return {
                        ...prev,
                        [crinzId]: postComments.filter(c => c.commentId !== commentId),
                    };
                });
            } else {
                // Only add remove action if not already present
                const exists = pendingActions.some(
                    a => a.type === "remove_comment" && a.crinzId === crinzId && a.payload === commentId
                );
                if (!exists) {
                    addAction(createAction("remove_comment", crinzId, commentId));
                }
            }
        },
        [pendingActions, addAction, replaceActions]
    );

    // Batch sync handler
    const handleBatchSync = useCallback(async () => {
        if (!pendingActions.length) {
            console.log("⚡ No pending actions to sync.");
            return;
        }
        console.log("🚀 Syncing batch actions...");
        const { remaining, processed } = await syncBatchActions(pendingActions);
        // console.log("✅ Sync result:", { remaining, processed });
        replaceActions(remaining);

        if (processed.length > 0) {
            await fetchMessages(true); // refresh after sync
            setComments({}); // clear comment cache forcing refetch if modal opens again
            setFetchedCommentPosts(new Set());
        }
    }, [pendingActions, replaceActions, fetchMessages]);

    return {
        likes,
        likeCounts,
        commentCounts,
        comments,
        fetchedCommentPosts,
        fetchCommentsForPost,
        handleLike,
        handleAddComment,
        handleRemoveComment,
        handleBatchSync,
        getCombinedComments,
        clearActions,
        setComments,
        setFetchedCommentPosts,
    };
}
