import React from "react";
import "../css/PersonalizedFeed.css";

interface PersonalizedFeedProps {
  searchTerm?: string;
}

const PersonalizedFeed: React.FC<PersonalizedFeedProps> = ({ searchTerm }) => {
  return (
    <div className="personalized-feed">
      <div className="feed-header">
        <p>Content tailored to your interests and interactions</p>
      </div>
      
      {searchTerm && (
        <div className="search-results-info">
          <p>Searching personalized feed for: "{searchTerm}"</p>
        </div>
      )}

      <div className="placeholder-content">
        <div className="placeholder-post">
          <div className="placeholder-avatar"></div>
          <div className="placeholder-content">
            <div className="placeholder-line short"></div>
            <div className="placeholder-line medium"></div>
          </div>
        </div>
        <div className="placeholder-post">
          <div className="placeholder-avatar"></div>
          <div className="placeholder-content">
            <div className="placeholder-line long"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedFeed;