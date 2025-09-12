import React from "react";
import "../css/ReelsFeed.css";

interface ReelsFeedProps {
  searchTerm?: string;
}

const ReelsFeed: React.FC<ReelsFeedProps> = ({ searchTerm }) => {
  return (
    <div className="reels-feed">
      {searchTerm && (
        <div className="search-results-info">
          <p>Searching reels for: "{searchTerm}"</p>
        </div>
      )}

      <div className="reels-grid">
        <div className="reel-item">
          <div className="reel-thumbnail"></div>
          <div className="reel-info">
            <div className="reel-user">@user1</div>
            <div className="reel-stats">❤️ 1.2K</div>
          </div>
        </div>
        <div className="reel-item">
          <div className="reel-thumbnail"></div>
          <div className="reel-info">
            <div className="reel-user">@user2</div>
            <div className="reel-stats">❤️ 2.4K</div>
          </div>
        </div>
        <div className="reel-item">
          <div className="reel-thumbnail"></div>
          <div className="reel-info">
            <div className="reel-user">@user3</div>
            <div className="reel-stats">❤️ 3.1K</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReelsFeed;