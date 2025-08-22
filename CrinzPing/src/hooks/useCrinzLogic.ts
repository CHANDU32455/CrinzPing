import { useEffect, useState, useRef } from "react";
import { useAuth } from "react-oidc-context";

export interface CrinzResponse {
  crinzId: string;
  userName: string;
  category: string;
  message: string;
  timestamp: string;
  likeCount: number;
  commentCount: number;
}

export function useCrinzLogic() {
  const auth = useAuth();

  const [crinzData, setCrinzData] = useState<CrinzResponse | null>(null);
  const [showTile, setShowTile] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [autoMode, setAutoMode] = useState(true);

  const lastHourRef = useRef<number | null>(null);

  const getCrinzMessage = async (): Promise<CrinzResponse | null> => {
    try {
      setIsFetching(true);

      const token = auth.user?.access_token;
      const userDetails = JSON.parse(localStorage.getItem("user_details") || "{}");
      const categories = userDetails?.categories || [];

      const res = await fetch(import.meta.env.VITE_CRINZ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categories }),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data: CrinzResponse = await res.json();

      setCrinzData(data);
      setShowTile(true);

      localStorage.setItem("crinz_cache", JSON.stringify(data));

      return data;
    } catch (err) {
      console.error("Fetch error:", err);
      return null;
    } finally {
      setIsFetching(false);
    }
  };

  const toggleAutoMode = () => {
    const updated = !autoMode;
    setAutoMode(updated);
    localStorage.setItem("crinz_auto_enabled", String(updated));
  };

  // Load cached roast when user logs in
  useEffect(() => {
    if (auth.isAuthenticated) {
      const cached = localStorage.getItem("crinz_cache");
      const auto = localStorage.getItem("crinz_auto_enabled");

      if (cached) {
        try {
          const parsed: CrinzResponse = JSON.parse(cached);
          setCrinzData(parsed);
          setShowTile(true);
        } catch {
          localStorage.removeItem("crinz_cache");
          getCrinzMessage();
        }
      } else {
        getCrinzMessage();
      }

      if (auto === "false") setAutoMode(false);
    }
  }, [auth.isAuthenticated]);

  // Auto fetch at 6/12/18 hrs
  useEffect(() => {
    const check = () => {
      if (!autoMode || !auth.isAuthenticated) return;
      const hour = new Date().getHours();
      const targets = [6, 12, 18];

      if (targets.includes(hour) && lastHourRef.current !== hour) {
        getCrinzMessage();
        lastHourRef.current = hour;
      }
    };

    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [autoMode, auth.isAuthenticated, auth.user?.access_token]);

  return {
    auth,
    crinzData,
    showTile,
    isFetching,
    autoMode,
    toggleAutoMode,
    getCrinzMessage,
  };
}
