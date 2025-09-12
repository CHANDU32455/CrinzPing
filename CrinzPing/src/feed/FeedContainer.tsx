import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FeedSwitcher from "./FeedSwitcher";
import SearchBar from "./SearchBar";
import GlobalFeed from "./tabs/GlobalFeed";
import PersonalizedFeed from "./tabs/PersonalizedFeed";
import ReelsFeed from "./tabs/ReelsFeed";
import "./css/FeedContainer.css";

const FeedContainer: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const defaultFeed = tab || "personalized";
  const [currentFeed, setCurrentFeed] = useState(defaultFeed);
  const [searchTerm, setSearchTerm] = useState("");
  const [hideHeader, setHideHeader] = useState(false);

  // handle tab change
  const handleFeedChange = (feedType: string) => {
    setCurrentFeed(feedType);
    setSearchTerm("");
    navigate(
      feedType === "personalized" ? "/workingFeed" : `/workingFeed/${feedType}`,
      { replace: true }
    );
  };

  // sync feed with route param
  useEffect(() => {
    setCurrentFeed(tab || "personalized");
  }, [tab]);

  // scroll listener for header visibility
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHideHeader(true); // scrolling down → hide
      } else {
        setHideHeader(false); // scrolling up → show
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="feed-container">
      <div className={`feed-header-container ${hideHeader ? "hidden" : ""}`}>
        <SearchBar
          onSearch={setSearchTerm}
          placeholder={`Search ${currentFeed} feed...`}
        />
        <FeedSwitcher
          currentFeed={currentFeed}
          onFeedChange={handleFeedChange}
        />
      </div>

      <div className="feed-content">
        <div style={{ display: currentFeed === "personalized" ? "block" : "none" }}>
          <PersonalizedFeed searchTerm={searchTerm} />
        </div>
        <div style={{ display: currentFeed === "global" ? "block" : "none" }}>
          <GlobalFeed searchTerm={searchTerm} />
        </div>
        <div style={{ display: currentFeed === "reels" ? "block" : "none" }}>
          <ReelsFeed searchTerm={searchTerm} />
        </div>
      </div>
    </div>
  );
};

export default FeedContainer;
