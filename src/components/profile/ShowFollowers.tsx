import React, { useState, useEffect } from "react";
import useFollow from "../../hooks/useFollow";
import { useNavigate, useParams } from "react-router-dom";

const ShowFollowers: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { followersList, loading, error, fetchFollowers, toggleFollowDirect, setFollowersList, followersLastKey } = useFollow(userId);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    console.log("[ShowFollowers] userId:", userId);
    if (userId) {
      fetchFollowers();
    }
  }, [userId]);

  const handleFollowToggle = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    setProcessingIds(prev => new Set(prev).add(targetUserId));

    setFollowersList(prevList =>
      prevList.map(user =>
        user.id === targetUserId
          ? { ...user, isFollowing: !isCurrentlyFollowing }
          : user
      )
    );

    try {
      await toggleFollowDirect(targetUserId, isCurrentlyFollowing);
    } catch (err) {
      console.error("Failed to toggle follow, reverting UI", err);
      fetchFollowers(true);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUserId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-center p-10">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {onBack && (
        <div className="mb-5">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
          >
            ← Back to Profile
          </button>
        </div>
      )}

      <div className="text-center mb-8 pb-4 border-b border-gray-700">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-400 mb-2">
          Your Followers
        </h1>
        <p className="text-gray-400 text-lg">
          {followersList.length} people following you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {followersList.map((user) => (
          <div
            key={user.id}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 border border-gray-700 hover:border-blue-400/30 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-4">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-14 h-14 rounded-full object-cover border-2 border-blue-400/30 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3
                  onClick={() => navigate(`/profile/${user.id}`)}
                  className="text-lg font-semibold text-purple-400 underline cursor-pointer hover:text-purple-300 truncate"
                >
                  @{user.username}
                </h3>
                <p className="text-blue-400 text-sm truncate">{user.name}</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
              {user.bio}
            </p>

            <div className="flex gap-4 mb-4">
              <span className="text-gray-400 text-xs">📝 {user.postCount} posts</span>
            </div>

            <button
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 mt-auto ${user.isFollowing
                ? "bg-gray-700 text-white hover:bg-red-500/20 hover:text-red-400"
                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                } ${processingIds.has(user.id) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              onClick={() => handleFollowToggle(user.id, user.isFollowing)}
              disabled={processingIds.has(user.id)}
            >
              {processingIds.has(user.id)
                ? 'Processing...'
                : user.isFollowing
                  ? 'Unfollow'
                  : 'Follow Back'
              }
            </button>
          </div>
        ))}
      </div>

      {followersLastKey && (
        <div className="text-center mt-10">
          <button
            onClick={() => fetchFollowers(true)}
            className="px-6 py-3 bg-blue-500 border-none rounded-lg cursor-pointer text-white text-base font-semibold hover:bg-blue-600 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default ShowFollowers;