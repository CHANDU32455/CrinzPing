import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserDetails } from "../hooks/UserInfo";
import Follow from "../following/Follow";
import { UserMemes } from "./profilePosts";
import UserReels from "./profileReels";
import "../css/baseprofileview.css";

const DEFAULT_AVATAR = "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
  <rect width="120" height="120" fill="#111827"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="#6b7280">No Image</text>
</svg>`);

interface BaseProfileProps {
  userSub?: string;
  showEdit?: boolean;
  showSignout?: boolean;
  onEdit?: () => void;
  allowActions?: boolean;
  currentUserId?: string;
}

type ContentType = 'messages' | 'posts' | 'reels';

const BaseProfileView: React.FC<BaseProfileProps> = ({
  userSub,
  showEdit,
  onEdit,
  allowActions,
  currentUserId,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get content from URL or default to 'messages'
  const tabParam = searchParams.get('content') as ContentType;
  const [activeTab, setActiveTab] = useState<ContentType>(
    (tabParam && ['messages', 'posts', 'reels'].includes(tabParam))
      ? tabParam
      : 'messages'
  );

  const [copied, setCopied] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const {
    userDetails,
    crinzMessages,
    loadingUser,
    loadingCrinz,
  } = useUserDetails(userSub);

  const auth = useAuth();

  // Memoize the user ID to prevent unnecessary re-renders
  const memoizedUserId = useMemo(() => userDetails?.userId, [userDetails?.userId]);

  const handleTabChange = useCallback((tab: ContentType) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);
    if (tab === 'messages') {
      params.delete('content');
    } else {
      params.set('content', tab);
    }
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  // Handle browser back/forward navigation
  React.useEffect(() => {
    const currentTab = searchParams.get('content') as ContentType;
    if (currentTab && ['messages', 'posts', 'reels'].includes(currentTab)) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  // Reset initial load flag after first render
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

  // Memoize the messages to prevent re-renders
  const uniqueMessages = useMemo(() =>
    Array.from(new Map(crinzMessages.map(m => [m.crinzId, m])).values()),
    [crinzMessages]
  );

  const profilePic = userDetails?.profilePic && userDetails.profilePic.startsWith("data:")
    ? userDetails.profilePic
    : userDetails?.profilePic || DEFAULT_AVATAR;

  const shareProfile = useCallback(() => {
    if (!userDetails?.userId) return;

    const shareUrl = `${window.location.origin}/profile/${userDetails.userId}${activeTab !== 'messages' ? `?content=${activeTab}` : ''}`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy share URL", err);
      });
  }, [userDetails, activeTab]);

  const handleShowFollowers = useCallback(() => {
    if (userDetails?.userId && allowActions) {
      navigate(`/profile/${userDetails.userId}/followers`);
    }
  }, [userDetails, navigate, allowActions]);

  const handleShowFollowing = useCallback(() => {
    if (userDetails?.userId && allowActions) {
      navigate(`/profile/${userDetails.userId}/following`);
    }
  }, [userDetails, navigate, allowActions]);

  // Updated: Allow clicking on messages even on others' profiles
  const handlePostClick = useCallback((post: any) => {
    // Always allow viewing messages, regardless of allowActions
    navigate(`/profile/${userDetails?.userId}/more?highlight=${post.crinzId}`);
  }, [userDetails, navigate]);

  if (loadingUser) {
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
                  {allowActions && (
                    <button
                      onClick={shareProfile}
                      className={`profile-share-btn ${copied ? "copied" : ""}`}
                      title="Share profile"
                    >
                      {copied ? "✓" : "🔗"}
                    </button>
                  )}
                </div>

                <div className="profile-action-buttons">
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
              </div>
              <p className="profile-tagline">{userDetails?.Tagline || ""}</p>
              
              {/* Follow Component - Only re-render on full page refresh */}
              <Follow
                key={memoizedUserId} // This ensures Follow only re-mounts when userId changes
                userId={memoizedUserId}
                isOwnProfile={!userSub || userSub === auth.user?.profile?.sub}
                onShowFollowers={handleShowFollowers}
                onShowFollowing={handleShowFollowing}
                allowActions={allowActions}
                forceRefresh={isInitialLoad} // Only force refresh on initial load
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
                uniqueMessages.slice(0, 5).map(post => (
                  <div
                    key={post.crinzId}
                    className="crinz-message-card"
                    onClick={() => handlePostClick(post)}
                    style={{ cursor: 'pointer' }} // Make it clear it's clickable
                  >
                    <div className="crinz-message-header">
                      <span className="crinz-username">@{userDetails?.displayName || "user"}</span>
                      <div className="crinz-stats">
                        <span className="crinz-stat">Likes:  {post.likeCount || 0}</span>
                        <span className="crinz-stat">Comments : {post.commentCount || 0}</span>
                      </div>
                    </div>
                    <p className="crinz-message-text">{post.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Posts Tab */}
            <div style={{ display: activeTab === 'posts' ? 'block' : 'none' }}>
              <h2 className="profile-content-title">Posts</h2>
              <UserMemes
                userId={memoizedUserId}
                currentUserId={currentUserId}
                previewMode={true}
              />
            </div>

            {/* Reels Tab */}
            <div style={{ display: activeTab === 'reels' ? 'block' : 'none' }}>
              <h2 className="profile-content-title">Reels</h2>
              <UserReels
                userId={memoizedUserId}
                currentUserId={currentUserId}
                previewMode={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaseProfileView;