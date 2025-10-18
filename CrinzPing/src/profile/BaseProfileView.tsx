import React, { useState, useMemo, useCallback } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import { useUserDetails, type CrinzMessage, type UserDetails } from "../hooks/UserInfo";
import { encodePostData } from "../utils/encodeDecode";
import Follow from "../following/Follow";
import UserMemes from "./profilePosts";
import UserReels from "./profileReels";
import "../css/baseprofileview.css";

const DEFAULT_AVATAR =
  "data:image/svg+xml;base64," +
  btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
  <rect width="120" height="120" fill="#111827"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="#6b7280">No Image</text>
</svg>`);

interface BaseProfileProps {
  userSub?: string;
  showEdit?: boolean;
  showSignout?: boolean;
  onEdit?: () => void;
  allowActions?: boolean;
  onPostClick?: (post: CrinzMessage) => void;
  userDetails?: UserDetails;
  crinzMessages?: CrinzMessage[];
  loadingUser?: boolean;
  loadingCrinz?: boolean;
}

type ContentType = 'messages' | 'posts' | 'reels';

const POSTS_PER_PAGE = 5;

const BaseProfileView: React.FC<BaseProfileProps> = ({
  userSub,
  showEdit,
  onEdit,
  onPostClick,
  userDetails: preloadedUserDetails,
  crinzMessages: preloadedCrinzMessages,
  loadingUser: preloadedLoadingUser = false,
  loadingCrinz: preloadedLoadingCrinz = false,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ContentType>('messages');
  const [loadedTabs, setLoadedTabs] = useState<Set<ContentType>>(new Set(['messages']));
  const [copied, setCopied] = useState(false);

  const {
    userDetails: hookUserDetails,
    crinzMessages: hookCrinzMessages,
    loadingUser: hookLoadingUser,
    loadingCrinz: hookLoadingCrinz,
    lastKey,
  } = useUserDetails(preloadedUserDetails ? undefined : userSub);

  const auth = useAuth();
  const userDetails = preloadedUserDetails || hookUserDetails;
  const crinzMessages = preloadedCrinzMessages || hookCrinzMessages;
  const loadingUser = preloadedLoadingUser || hookLoadingUser;
  const loadingCrinz = preloadedLoadingCrinz || hookLoadingCrinz;

  // Memoize the messages to prevent re-renders
  const uniqueMessages = useMemo(() =>
    Array.from(new Map(crinzMessages.map(m => [m.crinzId, m])).values()),
    [crinzMessages]
  );

  const hasMorePosts = uniqueMessages.length > POSTS_PER_PAGE || lastKey;

  const profilePic = userDetails?.profilePic && userDetails.profilePic.startsWith("data:")
    ? userDetails.profilePic
    : userDetails?.profilePic || DEFAULT_AVATAR;

  const handleTabChange = useCallback((tab: ContentType) => {
    setActiveTab(tab);
    setLoadedTabs(prev => new Set([...prev, tab]));
  }, []);

  const shareProfile = useCallback(() => {
    const targetUser = userDetails;
    if (!targetUser?.userId) return;

    const publicData = {
      userDetails: {
        userId: targetUser.userId,
        displayName: targetUser.displayName,
        profilePic: targetUser.profilePic,
        email: targetUser.email,
      },
      crinzMessages: (crinzMessages || []).slice(0, 5).map(msg => ({
        crinzId: msg.crinzId,
        message: msg.message,
      })),
    };

    const encoded = encodePostData(publicData);
    const shareUrl = `${window.location.origin}/public-profile?data=${encoded}`;

    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy share URL", err);
      });
  }, [userDetails, crinzMessages]);

  const handleShowFollowers = useCallback(() => {
    if (userDetails?.userId) {
      navigate(`/profile/${userDetails.userId}/followers`);
    }
  }, [userDetails, navigate]);

  const handleShowFollowing = useCallback(() => {
    if (userDetails?.userId) {
      navigate(`/profile/${userDetails.userId}/following`);
    }
  }, [userDetails, navigate]);

  const handleSeeMore = useCallback(() => {
    if (onPostClick && userDetails) {
      onPostClick({ crinzId: "see-more", message: "See All Posts" });
    } else if (userDetails?.userId) {
      navigate(`/profile/${userDetails.userId}/more`);
    }
  }, [onPostClick, userDetails, navigate]);

  if (loadingUser && !preloadedUserDetails) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-inner">
        <div className="profile-card">
          {/* Header Section */}
          <div className="profile-header">
            {/* Profile Image */}
            <div className="profile-avatar-container">
              <img src={profilePic} alt="Profile" className="profile-avatar" />
            </div>

            {/* User Info and Actions */}
            <div className="profile-info">
              <div className="profile-info-header">
                <div className="profile-display">
                  <h1 className="profile-name">{userDetails?.displayName || "User"}</h1>
                  <button
                    onClick={shareProfile}
                    className={`profile-share-btn ${copied ? "copied" : ""}`}
                    title="Share profile"
                  >
                    {copied ? "✓" : "🔗"}
                  </button>
                </div>

                {showEdit && (
                  <button onClick={onEdit} className="profile-edit-btn">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </button>
                )}
              </div>

              <p className="profile-tagline">{userDetails?.Tagline || ""}</p>

              {/* Follow Component */}
              <Follow
                userId={userDetails?.userId}
                isOwnProfile={!userSub || userSub === auth.user?.profile?.sub}
                onShowFollowers={handleShowFollowers}
                onShowFollowing={handleShowFollowing}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="profile-tabs scrollbar-hide">
            {(["messages", "posts", "reels"] as ContentType[]).map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`profile-tab-btn ${activeTab === tab ? "active" : ""}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="profile-tab-content">
            {/* Messages Tab */}
            <div style={{ display: activeTab === 'messages' ? 'block' : 'none' }}>
              <h2 className="profile-content-title">Crinz Messages</h2>
              {loadingCrinz && uniqueMessages.length === 0 ? (
                <div className="profile-loading">
                  <div className="profile-spinner"></div>
                  <p className="profile-loading-text">Loading messages…</p>
                </div>
              ) : uniqueMessages.length === 0 ? (
                <div className="profile-empty-state">
                  <p className="profile-empty-text">No Crinz messages yet.</p>
                </div>
              ) : (
                uniqueMessages.slice(0, POSTS_PER_PAGE).map(post => (
                  <div
                    key={post.crinzId}
                    className="crinz-message-card"
                    onClick={() =>
                      onPostClick
                        ? onPostClick(post)
                        : navigate(`/profile/${userDetails?.userId}/more?highlight=${post.crinzId}`)
                    }
                  >
                    <div className="crinz-message-header">
                      <span className="crinz-username">@{userDetails?.displayName || "user"}</span>
                      <div className="crinz-stats">
                        <span className="crinz-stat">💖 {post.likeCount || 0}</span>
                        <span className="crinz-stat">💬 {post.commentCount || 0}</span>
                      </div>
                    </div>
                    <p className="crinz-message-text">{post.message}</p>
                  </div>
                ))
              )}

              {hasMorePosts && !loadingCrinz && (
                <div className="profile-see-more-container">
                  <button onClick={handleSeeMore} className="profile-see-more-btn">
                    See All Messages ({uniqueMessages.length}+)
                  </button>
                </div>
              )}
            </div>

            {/* Posts Tab */}
            {(activeTab === 'posts' || loadedTabs.has('posts')) && (
              <div style={{ display: activeTab === 'posts' ? 'block' : 'none' }}>
                <h2 className="profile-content-title">Posts</h2>
                <UserMemes userId={userDetails?.userId} />
              </div>
            )}

            {/* Reels Tab */}
            {(activeTab === 'reels' || loadedTabs.has('reels')) && (
              <div style={{ display: activeTab === 'reels' ? 'block' : 'none' }}>
                <h2 className="profile-content-title">Reels</h2>
                <UserReels userId={userDetails?.userId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaseProfileView;