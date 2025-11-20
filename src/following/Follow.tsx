import React, { useState, useEffect } from "react";
import useFollow from "./useFollow";
import "./follow.css";

interface FollowProps {
  userId?: string;
  isOwnProfile?: boolean;
  onShowFollowers?: () => void;
  onShowFollowing?: () => void;
  allowActions?: boolean;
  forceRefresh?: boolean;
}

const Follow: React.FC<FollowProps> = ({ 
  userId, 
  isOwnProfile = false, 
  onShowFollowers, 
  onShowFollowing,
  forceRefresh = false
}) => {
  const { stats, loading, error, toggleFollow, refreshStats } = useFollow(userId);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refresh stats when forceRefresh changes or on initial mount
  useEffect(() => {
    if (forceRefresh && userId) {
      refreshStats();
    }
  }, [forceRefresh, userId, refreshStats]);

  const handleFollowToggle = async () => {
    if (isOwnProfile || !userId) return;
    
    setIsProcessing(true);
    await toggleFollow(userId);
    setIsProcessing(false);
  };

  const handleFollowersClick = () => {
    if (onShowFollowers && isOwnProfile) {
      onShowFollowers();
    }
  };

  const handleFollowingClick = () => {
    if (onShowFollowing && isOwnProfile) {
      onShowFollowing();
    }
  };

  if (loading) {
    return (
      <div className="fw-container">
        <div className="fw-stats-loading">
          <div className="loading-spinner small"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fw-container">
        <div className="fw-error">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="fw-container">
      <div className="fw-stats">
        <div 
          className={`fw-stat ${isOwnProfile ? 'fw-stat-clickable' : ''}`}
          onClick={handleFollowersClick}
        >
          <span className="fw-number">{stats.followersCount.toLocaleString()}</span>
          <span className="fw-label">Followers</span>
        </div>
        <div 
          className={`fw-stat ${isOwnProfile ? 'fw-stat-clickable' : ''}`}
          onClick={handleFollowingClick}
        >
          <span className="fw-number">{stats.followingCount.toLocaleString()}</span>
          <span className="fw-label">Following</span>
        </div>
      </div>
      
      {!isOwnProfile && (
        <button
          className={`fw-btn ${stats.isFollowing ? "following" : ""}`}
          onClick={handleFollowToggle}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : stats.isFollowing ? "UNFOLLOW" : "FOLLOW"}
        </button>
      )}
    </div>
  );
};

export default Follow;