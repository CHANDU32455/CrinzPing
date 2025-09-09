import React, { useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import { useUserDetails, type CrinzMessage, type UserDetails } from "../hooks/UserInfo";
import { encodePostData } from "../utils/encodeDecode";
import SignOutButton from "../components/SignOutButton";
import Follow from "../following/Follow";
import "./profilepage.css";


const DEFAULT_AVATAR =
  "data:image/svg+xml;base64," +
  btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
  <rect width="120" height="120" fill="#f0f2f5"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="#8a8d91">No Image</text>
</svg>`);

interface BaseProfileProps {
  userSub?: string;
  showEdit?: boolean;
  showSignout?: boolean;
  onEdit?: () => void;
  allowActions?: boolean;
  onPostClick?: (post: CrinzMessage) => void;
  // Add these props for pre-loaded data
  userDetails?: UserDetails;
  crinzMessages?: CrinzMessage[];
  loadingUser?: boolean;
  loadingCrinz?: boolean;
}

const POSTS_PER_PAGE = 5;

const BaseProfileView: React.FC<BaseProfileProps> = ({
  userSub,
  showEdit,
  showSignout,
  onEdit,
  allowActions = true,
  onPostClick,
  // New props for pre-loaded data
  userDetails: preloadedUserDetails,
  crinzMessages: preloadedCrinzMessages,
  loadingUser: preloadedLoadingUser = false,
  loadingCrinz: preloadedLoadingCrinz = false,
}) => {
  const navigate = useNavigate();
  // Only use the hook if we don't have preloaded data and we have a userSub
  const {
    userDetails: hookUserDetails,
    crinzMessages: hookCrinzMessages,
    loadingUser: hookLoadingUser,
    loadingCrinz: hookLoadingCrinz,
    lastKey,
  } = useUserDetails(preloadedUserDetails ? undefined : userSub);

  // Use preloaded data if available, otherwise use hook data
  const auth = useAuth();
  const userDetails = preloadedUserDetails || hookUserDetails;
  const crinzMessages = preloadedCrinzMessages || hookCrinzMessages;
  const loadingUser = preloadedLoadingUser || hookLoadingUser;
  const loadingCrinz = preloadedLoadingCrinz || hookLoadingCrinz;

  const uniqueMessages = Array.from(new Map(crinzMessages.map(m => [m.crinzId, m])).values());
  const hasMorePosts = uniqueMessages.length > POSTS_PER_PAGE || lastKey;

  const [copied, setCopied] = useState(false);

  const profilePic = userDetails?.profilePic && userDetails.profilePic.startsWith("data:")
    ? userDetails.profilePic   // cached Base64 pic
    : userDetails?.profilePic || DEFAULT_AVATAR;

  const shareProfile = () => {
    if (!userDetails?.userId || !allowActions) return;

    const publicData = {
      userDetails: {
        userId: userDetails.userId,
        displayName: userDetails.displayName,
        profilePic: userDetails.profilePic,
        email: userDetails.email,
      },
      crinzMessages: uniqueMessages.slice(0, 5).map(msg => ({
        crinzId: msg.crinzId,
        message: msg.message,
      })),
    };

    const encoded = encodePostData(publicData);
    const shareUrl = `${window.location.origin}/public-profile?data=${encoded}`;

    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShowFollowers = () => {
    if (userDetails?.userId) {
      // Either navigate or show in modal - here's navigation approach
      navigate(`/profile/${userDetails.userId}/followers`);
      // Or if you want to show in the same page:
      // setShowFollowersList(true);
      // setShowFollowingList(false);
    }
  };

  const handleShowFollowing = () => {
    if (userDetails?.userId) {
      navigate(`/profile/${userDetails.userId}/following`);
      // Or if you want to show in the same page:
      // setShowFollowingList(true);
      // setShowFollowersList(false);
    }
  };

  const handleSeeMore = () => {
    if (onPostClick && userDetails) {
      onPostClick({ crinzId: "see-more", message: "See All Posts" });
    } else if (userDetails?.userId) {
      navigate(`/profile/${userDetails.userId}/more`);
    }
  };

  if (loadingUser && !preloadedUserDetails) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        {showEdit && (
          <div className="profile-actions-top">
            <button onClick={onEdit} className="btn-edit">
              Edit Profile
            </button>
          </div>
        )}

        <div className="profile-header">
          <div className="avatar-container">
            {userDetails?.Tagline && (
              <div className="tagline">{userDetails.Tagline}</div>
            )}

            <img
              src={profilePic}
              alt="Profile"
              className="profile-avatar"
            />
          </div>
          <div className="profile-info">
            <h1 className="profile-name">
              {userDetails?.displayName || "User"}
              <button
                onClick={shareProfile}
                className={`btn-share ${copied ? "copied" : ""}`}
              >
                {copied ? "✅" : "🔗"}
              </button>
            </h1>
            <p className="profile-email">{userDetails?.email || ""}</p>
          </div>
          {allowActions && (
            <Follow
              userId={userDetails?.userId}
              isOwnProfile={!userSub || userSub === auth.user?.profile?.sub}
              onShowFollowers={handleShowFollowers}
              onShowFollowing={handleShowFollowing}
            />
          )}
        </div>

        <div className="profile-section">
          <h2 className="section-title">Crinz Messages</h2>
          {loadingCrinz && uniqueMessages.length === 0 ? (
            <div className="loading-posts">
              <div className="loading-spinner small"></div>
              <p>Loading messages…</p>
            </div>
          ) : uniqueMessages.length === 0 ? (
            <div className="empty-state">
              <p>No Crinz messages yet.</p>
            </div>
          ) : (
            <div className="posts-container">
              {uniqueMessages.slice(0, POSTS_PER_PAGE).map(post => (
                <div
                  key={post.crinzId}
                  className="post-card-link"
                  onClick={() =>
                    onPostClick
                      ? onPostClick(post)
                      : navigate(
                        `/profile/${userDetails?.userId}/more?highlight=${post.crinzId}`
                      )
                  }
                >
                  <div className="post-card">
                    <div className="post-header">
                      <span className="post-username">
                        @{userDetails?.displayName || "user"}
                      </span>
                    </div>
                    <p className="post-content">{post.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMorePosts && !loadingCrinz && (
            <div className="see-more-container">
              <button className="see-more-link" onClick={handleSeeMore}>
                See All Posts ({uniqueMessages.length}+)
              </button>
            </div>
          )}
        </div>

        {showSignout && (
          <div className="signout-container">
            <SignOutButton />
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseProfileView;

