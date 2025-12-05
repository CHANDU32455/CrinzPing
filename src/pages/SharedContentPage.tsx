// src/pages/SharedContentPage.tsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import PostTile from "../components/feed/PostTile";
import ReelTile from "../components/feed/ReelTile";
import CrinzTile from "../components/feed/CrinzMessageTile";
import CommentModal from "../components/feed/CommentModal";
import ShareComponent from "../components/shared/ShareComponent";
import { contentManager } from "../utils/Posts_Reels_Stats_Syncer";
import { API_ENDPOINTS } from "../constants/apiEndpoints";
import SEO from "../components/shared/SEO";

interface CommentItem {
    id: string;
    type: 'post' | 'reel' | 'crinz_message';
    content: string;
    user?: {
        userName: string;
    };
    commentCount?: number;
}

interface ShareFile {
    type: string;
    url: string;
}

interface ShareItem {
    id: string;
    type: 'post' | 'reel' | 'crinz_message';
    content: string;
    user?: {
        userName: string;
    };
    files?: ShareFile[];
    timestamp?: number;
    likeCount?: number;
    likes?: number;
    commentCount?: number;
    comments?: number;
}

interface SharedContent {
    id: string;
    type: "crinz_message" | "post" | "reel";
    userId: string;
    content: string;
    timestamp: string; // Change back to string to match components
    likeCount: number;
    commentCount: number;
    files: Array<{
        type: string;
        url: string;
        s3Key: string;
        contentType: string;
    }>;
    user: {
        userName: string;
        profilePic: string;
        tagline: string;
    };
    isLikedByUser: boolean;
    userIsAuthenticated: boolean;
    hasAudio?: boolean;
    imageCount?: number;
    likes?: number;
    comments?: number;
}

// Custom authentication alert component
const AuthRequiredAlert = ({ onClose, onSignIn }: { onClose: () => void; onSignIn: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-6 max-w-sm w-full mx-auto animate-scale-in">
                <div className="text-center">
                    <div className="text-4xl mb-4">🔐</div>
                    <h3 className="text-white text-lg font-bold mb-2">Join the Conversation</h3>
                    <p className="text-gray-300 text-sm mb-6">
                        Sign in to like, comment, and connect with the Crinz community
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg transition-colors text-sm"
                        >
                            Maybe Later
                        </button>
                        <button
                            onClick={onSignIn}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors text-sm font-medium"
                        >
                            Sign In Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function SharedContentPage() {
    const { contentType, contentId } = useParams<{ contentType: string; contentId: string }>();
    const navigate = useNavigate();
    const auth = useAuth();
    const currentUserId = auth.user?.profile?.sub;

    // ✅ ALWAYS try to get access token, even if it's null
    const accessToken = auth.user?.access_token || undefined;

    const [content, setContent] = useState<SharedContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAuthAlert, setShowAuthAlert] = useState(false);

    // Modal states
    const [commentModal, setCommentModal] = useState<{
        isOpen: boolean;
        postId: string;
        userName: string;
        postMessage: string;
        commentCount: number;
        contentType?: 'post' | 'reel' | 'crinz_message';
    } | null>(null);

    const [shareModal, setShareModal] = useState<{
        isOpen: boolean;
        contentId: string;
        contentType: 'post' | 'reel' | 'crinz_message';
        userName: string;
        message: string;
        timestamp: string | number;
        likeCount: number;
        commentCount: number;
        mediaUrl?: string;
    } | null>(null);

    useEffect(() => {
        const fetchSharedContent = async () => {
            if (!contentType || !contentId) {
                setError("Invalid content URL");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const payload = {
                    contentType,
                    contentId,
                    currentUserId: auth.isAuthenticated ? currentUserId : null
                };
                const headers: HeadersInit = { "Content-Type": "application/json" };

                if (accessToken) {
                    headers.Authorization = `Bearer ${accessToken}`;
                    console.log("🔐 Sending access token with request");
                } else {
                    console.log("🔓 No access token available - public access");
                }

                const response = await fetch(
                    `${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.GET_SHARE_CONTENT}`,
                    {
                        method: "POST",
                        headers,
                        body: JSON.stringify(payload),
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to load content: ${response.status} - ${errorText}`);
                }

                const data = await response.json();

                // Convert timestamp from number to string for component compatibility
                const contentData = {
                    ...data.content,
                    timestamp: new Date(data.content.timestamp).toISOString() // Convert to ISO string
                };

                // Set the content from the response
                setContent(contentData);

                // Initialize content manager stats if authenticated
                if (contentData.userIsAuthenticated) {
                    contentManager.initializeContentStats(contentData.id, {
                        likeCount: contentData.likeCount,
                        commentCount: contentData.commentCount,
                        shareCount: 0,
                        viewCount: 0,
                        isLikedByUser: contentData.isLikedByUser
                    });
                }

            } catch (err) {
                console.error("❌ Error fetching shared content:", err);
                setError(err instanceof Error ? err.message : "Failed to fetch content");
            } finally {
                setLoading(false);
            }
        };

        fetchSharedContent();
    }, [contentType, contentId, accessToken, auth.isAuthenticated, currentUserId]);

    // Handle like updates from child components - MOVED UP
    const handleLikeUpdate = useCallback((contentId: string, newLikeCount: number, isLiked: boolean) => {
        console.log('✅ Shared Page: Like updated for:', contentId, 'count:', newLikeCount, 'liked:', isLiked);

        // Update local content state
        if (content && content.id === contentId) {
            setContent(prev => prev ? {
                ...prev,
                likeCount: newLikeCount,
                isLikedByUser: isLiked
            } : null);
        }

        // Update content manager stats
        const currentStats = contentManager.getContentStats(contentId);
        if (currentStats) {
            contentManager.initializeContentStats(contentId, {
                ...currentStats,
                likeCount: newLikeCount,
                isLikedByUser: isLiked
            });
        }
    }, [content]);

    // Auth alert handlers
    const handleCloseAuthAlert = useCallback(() => {
        setShowAuthAlert(false);
    }, []);

    const handleSignInFromAlert = useCallback(() => {
        setShowAuthAlert(false);
        auth.signinRedirect();
    }, [auth]);

    const handleOpenComment = useCallback((item: CommentItem) => {
        console.log('🔍 Opening comment for:', {
            id: item.id,
            type: item.type,
            content: item.content
        });

        // Check authentication before opening comment modal
        if (!auth.isAuthenticated) {
            console.log("🔐 User not authenticated, showing auth alert");
            setShowAuthAlert(true);
            return;
        }

        setCommentModal({
            isOpen: true,
            postId: item.id,
            userName: item.user?.userName || 'Anonymous',
            postMessage: item.content,
            commentCount: item.commentCount || 0,
            contentType: item.type
        });
    }, [auth]);

    const handleCloseComment = useCallback(() => {
        setCommentModal(null);
    }, []);

    const handleOpenShare = useCallback((item: ShareItem) => {
        const mediaUrl = Array.isArray(item.files) ? item.files.find((f: ShareFile) => f.type?.startsWith('video/') || f.type?.startsWith('image/'))?.url : undefined;

        // Handle both string and number timestamps
        let timestamp = item.timestamp;
        if (typeof timestamp === 'string') {
            timestamp = new Date(timestamp).getTime(); // Convert to number for ShareComponent
        }

        setShareModal({
            isOpen: true,
            contentId: item.id,
            contentType: item.type,
            userName: item.user?.userName || 'Anonymous',
            message: item.content,
            timestamp: timestamp || Date.now(),
            likeCount: item.likeCount ?? item.likes ?? 0,
            commentCount: item.commentCount ?? item.comments ?? 0,
            mediaUrl
        });
    }, []);

    const handleCloseShare = useCallback(() => {
        setShareModal(null);
    }, []);

    // Create wrapped handlers that check authentication
    const handleWrappedComment = useCallback(() => {
        if (!content) return;
        handleOpenComment(content);
    }, [content, handleOpenComment]);

    const handleWrappedShare = useCallback(() => {
        if (!content) return;

        // Convert SharedContent to ShareItem by handling timestamp conversion
        const shareItem: ShareItem = {
            ...content,
            timestamp: typeof content.timestamp === 'string'
                ? new Date(content.timestamp).getTime()
                : content.timestamp
        };

        handleOpenShare(shareItem);
    }, [content, handleOpenShare]);

    const handleWrappedLikeUpdate = useCallback((contentId: string, newLikeCount: number, isLiked: boolean) => {
        // Check authentication before allowing like updates
        if (!auth.isAuthenticated) {
            setShowAuthAlert(true);
            return;
        }
        handleLikeUpdate(contentId, newLikeCount, isLiked);
    }, [auth.isAuthenticated, handleLikeUpdate]);

    const handleNewComment = useCallback((postId: string) => {
        console.log('✅ Shared Page: New comment added to post:', postId);

        // Update local content state
        if (content && content.id === postId) {
            setContent(prev => prev ? {
                ...prev,
                commentCount: (prev.commentCount || 0) + 1
            } : null);
        }

        // Update content manager stats
        const currentStats = contentManager.getContentStats(postId);
        if (currentStats) {
            contentManager.initializeContentStats(postId, {
                ...currentStats,
                commentCount: currentStats.commentCount + 1
            });
        }
    }, [content]);

    const handleDeleteComment = useCallback((postId: string) => {
        console.log('✅ Shared Page: Comment deleted from post:', postId);

        // Update local content state
        if (content && content.id === postId) {
            setContent(prev => prev ? {
                ...prev,
                commentCount: Math.max(0, (prev.commentCount || 1) - 1)
            } : null);
        }

        // Update content manager stats
        const currentStats = contentManager.getContentStats(postId);
        if (currentStats) {
            contentManager.initializeContentStats(postId, {
                ...currentStats,
                commentCount: Math.max(0, currentStats.commentCount - 1)
            });
        }
    }, [content]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading content...</p>
                    <p className="text-gray-400 text-sm mt-2">
                        {auth.isAuthenticated ? "🔐 Authenticated" : "🔓 Public Access"}
                    </p>
                </div>
            </div>
        );
    }

    if (error || !content) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
                    <div className="text-4xl mb-4">❌</div>
                    <h2 className="text-white text-xl font-bold mb-2">Content Not Found</h2>
                    <p className="text-red-200 mb-4">
                        {error || "The content you're looking for doesn't exist or you don't have access to it."}
                    </p>
                    <div className="bg-black/50 rounded-lg p-4 text-left mb-4">
                        <pre className="text-green-400 text-sm">
                            Auth Status: {auth.isAuthenticated ? "Authenticated" : "Not Authenticated"}{"\n"}
                            ContentType: {contentType}{"\n"}
                            ContentID: {contentId}
                        </pre>
                    </div>
                    <button
                        onClick={() => navigate("/")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    // Get the best image for SEO sharing
    const getShareImage = () => {
        if (!content?.files?.length) return undefined;

        // For reels, try to get thumbnail or first video frame
        if (content.type === 'reel') {
            // Check for explicit thumbnail
            const thumbnail = content.files.find(f => f.type?.startsWith('image/'));
            if (thumbnail) return thumbnail.url;
            // Otherwise return video URL (some platforms can extract frame)
            const video = content.files.find(f => f.type?.startsWith('video/'));
            return video?.url;
        }

        // For posts, get first image
        const image = content.files.find(f => f.type?.startsWith('image/'));
        return image?.url;
    };

    const getContentTitle = () => {
        if (content.type === 'reel') return `Reel by ${content.user?.userName || 'Anonymous'} | CrinzPing`;
        if (content.type === 'post') return `Post by ${content.user?.userName || 'Anonymous'} | CrinzPing`;
        return `Crinz by ${content.user?.userName || 'Anonymous'} | CrinzPing`;
    };

    // Generic description for crinz (don't reveal actual message), show caption for reels/posts
    const getContentDescription = () => {
        if (content.type === 'crinz_message') {
            return `Check out this Crinz on CrinzPing - the cringiest social platform! 🤭`;
        }
        return content.content?.slice(0, 160) || `Check out this ${content.type} on CrinzPing`;
    };

    return (
        <>
            {/* Dynamic SEO - Uses reel thumbnail or post image for social sharing! */}
            <SEO
                title={getContentTitle()}
                description={getContentDescription()}
                image={getShareImage()}
                url={`https://crinzping.com/shared/${content.type}/${content.id}`}
                type={content.type === 'reel' ? 'video.other' : 'article'}
            />
            <div className="min-h-screen bg-gray-950 py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Header with auth status */}
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                        >
                            <span>←</span>
                            Back to Home
                        </button>
                        <div className="text-right">
                            <p className="text-gray-400 text-sm">
                                {content.userIsAuthenticated ? "🔐 Authenticated Access" : "🔓 Public Access"}
                            </p>
                        </div>
                    </div>

                    {/* Content Tile - Using same components as PersonalizedFeed */}
                    <div className="scroll-m-20">
                        {content.type === 'post' && (
                            <PostTile
                                item={content}
                                onComment={handleWrappedComment}
                                onShare={handleWrappedShare}
                                onLikeUpdate={handleWrappedLikeUpdate}
                            />
                        )}
                        {content.type === 'reel' && (
                            <ReelTile
                                item={content}
                                onComment={handleWrappedComment}
                                onShare={handleWrappedShare}
                                onLikeUpdate={handleWrappedLikeUpdate}
                            />
                        )}
                        {content.type === 'crinz_message' && (
                            <CrinzTile
                                item={content}
                                onComment={handleWrappedComment}
                                onShare={handleWrappedShare}
                                onLikeUpdate={handleWrappedLikeUpdate}
                            />
                        )}
                    </div>

                    {/* Auth Status Info */}
                    <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs">
                                    {content.userIsAuthenticated
                                        ? "You can like, comment, and interact with this content"
                                        : "Sign in to interact with this content"
                                    }
                                </p>
                            </div>
                            {!auth.isAuthenticated && (
                                <button
                                    onClick={() => auth.signinRedirect()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    Sign In
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Auth Required Alert */}
                {showAuthAlert && (
                    <AuthRequiredAlert
                        onClose={handleCloseAuthAlert}
                        onSignIn={handleSignInFromAlert}
                    />
                )}



                {/* Comment Modal */}
                {commentModal && (
                    <CommentModal
                        postId={commentModal.postId}
                        isOpen={commentModal.isOpen}
                        onClose={handleCloseComment}
                        userName={commentModal.userName}
                        postMessage={commentModal.postMessage}
                        commentCount={commentModal.commentCount}
                        contentType={commentModal.contentType}
                        currentUserId={currentUserId}
                        accessToken={accessToken}
                        onNewComment={handleNewComment}
                        onDeleteComment={handleDeleteComment}
                    />
                )}

                {/* Share Modal */}
                {shareModal && (
                    <ShareComponent
                        isOpen={shareModal.isOpen}
                        onClose={handleCloseShare}
                        postId={shareModal.contentId}
                        userName={shareModal.userName}
                        message={shareModal.message}
                        timestamp={shareModal.timestamp}
                        likeCount={shareModal.likeCount}
                        commentCount={shareModal.commentCount}
                        contentType={shareModal.contentType}
                        mediaUrl={shareModal.mediaUrl}
                    />
                )}
            </div>
        </>
    );
}