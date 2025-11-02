import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface FeedHighlightHandlerProps {
  onHighlight: (postId: string | null) => void;
  ready: boolean;
}

export const FeedHighlightHandler: React.FC<FeedHighlightHandlerProps> = ({ onHighlight, ready }) => {
  const { search, pathname } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const highlightId = params.get("highlight");

// FeedHighlightHandler
useEffect(() => {
  if (highlightId && ready) {
    onHighlight(highlightId);

    const timer = setTimeout(() => {
      onHighlight(null);
      navigate(pathname, { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }
}, [highlightId, onHighlight, ready, pathname, navigate]);

  return null;
};
