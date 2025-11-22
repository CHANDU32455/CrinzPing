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
          People You Follow
        </h1>
        <p className="text-gray-400 text-lg">
          {followingList.length} accounts you're following
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {followingList.map((user) => (
          <div
            key={user.id}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 border border-gray-700 hover:border-blue-400/30 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
            onClick={() => navigate(`/profile/${user.id}`)}
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
                  className="text-lg font-semibold text-blue-300 underline cursor-pointer hover:text-blue-200 truncate"
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
              className="w-full py-3 px-4 bg-gray-700 text-white rounded-lg font-semibold hover:bg-red-500/20 hover:text-red-400 transition-all duration-300 mt-auto cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleFollowToggle(user.id);
              }}
              disabled={processingIds.has(user.id)}
            >
              {processingIds.has(user.id) ? 'Processing...' : 'Unfollow'}
            </button>
          </div>
        ))}
      </div>

      {followingLastKey && (
        <div className="text-center mt-10">
          <button
            onClick={() => fetchFollowing(true)}
            className="px-6 py-3 bg-blue-500 border-none rounded-lg cursor-pointer text-white text-base font-semibold hover:bg-blue-600 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default ShowFollowing;