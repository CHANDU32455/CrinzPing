import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useFollow from "./useFollow";

const ShowFollowing: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { followingList, loading, error, fetchFollowing, toggleFollowDirect, setFollowingList, followingLastKey } = useFollow(userId);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (userId) {
      fetchFollowing();
    }
  }, [userId]);

  const handleFollowToggle = async (targetUserId: string) => {
    setProcessingIds(prev => new Set(prev).add(targetUserId));

    // OPTIMISTIC UI UPDATE: Remove the user immediately from the list
    setFollowingList(prevList => prevList.filter(user => user.id !== targetUserId));

    try {
      await toggleFollowDirect(targetUserId, true);
    } catch (err) {
      console.error("Failed to unfollow, reverting UI", err);
      fetchFollowing(true);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUserId);
        return newSet;
      });
    }
  };

  // Fixed container styles
  const containerStyle: React.CSSProperties = {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#ffffff'
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '32px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#64b5f6'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '16px',
    color: '#888',
    marginBottom: '24px'
  };

  // Fixed grid style with consistent columns
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
    padding: '0',
    width: '100%'
  };

  // Fixed card style with consistent dimensions
  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #1a1a1a, #2d2d2d)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    height: 'fit-content',
    minHeight: '220px',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer'
  };

  const headerContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px'
  };

  const avatarStyle: React.CSSProperties = {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(100, 181, 246, 0.3)',
    flexShrink: 0
  };

  const usernameStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '4px',
    color: '#73a3e2ff',
    textDecoration: "underline",
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  };

  const nameStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#64b5f6',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  };

  const bioStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#aaa',
    lineHeight: '1.4',
    marginBottom: '16px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
  };

  const statsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px'
  };

  const statStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#888'
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: 'auto'
  };

  const unfollowButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff'
  };

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px'
  };

  const spinnerStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(100, 181, 246, 0.3)',
    borderTop: '4px solid #64b5f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <div style={spinnerStyle}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{ color: '#ff4757', textAlign: 'center', padding: '40px' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {onBack && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={onBack}
            style={{
              padding: '10px 16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            ← Back to Profile
          </button>
        </div>
      )}

      <div style={headerStyle}>
        <h1 style={titleStyle}>People You Follow</h1>
        <p style={subtitleStyle}>{followingList.length} accounts you're following</p>
      </div>

      <div style={gridStyle}>
        {followingList.map((user) => (
          <div
            key={user.id}
            style={cardStyle}
            onClick={() => navigate(`/profile/${user.id}`)}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, {
                transform: 'translateY(-4px)',
                borderColor: 'rgba(100, 181, 246, 0.3)',
                boxShadow: '0 12px 40px rgba(100, 181, 246, 0.2)'
              });
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, {
                transform: '',
                borderColor: '',
                boxShadow: ''
              });
            }}
          >
            <div style={headerContainerStyle}>
              <img
                src={user.avatar}
                alt={user.username}
                style={avatarStyle}
              />
              <div style={{ overflow: 'hidden' }}>
                <h3 onClick={() => navigate(`/profile/${user.id}`)}
                  style={usernameStyle}>@{user.username}</h3>
                <p style={nameStyle}>{user.name}</p>
              </div>
            </div>

            <p style={bioStyle}>{user.bio}</p>

            <div style={statsStyle}>
              <span style={statStyle}>📝 {user.postCount} posts</span>
            </div>

            <button
              style={unfollowButtonStyle}
              onClick={(e) => {
                e.stopPropagation();
                handleFollowToggle(user.id);
              }}
              disabled={processingIds.has(user.id)}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, {
                  background: 'rgba(244, 67, 54, 0.2)',
                  color: '#ff4757'
                });
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, {
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff'
                });
              }}
            >
              {processingIds.has(user.id) ? 'Processing...' : 'Unfollow'}
            </button>
          </div>
        ))}
      </div>

      {followingLastKey && (
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button
            onClick={() => fetchFollowing(true)}
            style={{
              padding: "12px 24px",
              background: "#64b5f6",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "600"
            }}
          >
            Load More
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ShowFollowing;