import { useEffect, useState, useRef } from "react";
import { useAuth } from "react-oidc-context";

export function useCrinzLogic() {
  const auth = useAuth();
  const [crinzMessage, setCrinzMessage] = useState("");
  const [showTile, setShowTile] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [lastRoastTime, setLastRoastTime] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [fetchCount, setFetchCount] = useState(0);

  const lastHourRef = useRef<number | null>(null);

  const getCrinzMessage = async (toast = false) => {
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
      const { message } = await res.json();

      const now = new Date().toLocaleString();
      setCrinzMessage(message);
      setLastRoastTime(now);
      setShowTile(true);
      setFetchCount((f) => f + 1);

      localStorage.setItem("crinz_cache", message);
      localStorage.setItem("crinz_last_time", now);

      if (toast) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setCrinzMessage("The roast server blinked first.");
      setShowTile(true);
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
      const time = localStorage.getItem("crinz_last_time");
      const auto = localStorage.getItem("crinz_auto_enabled");

      if (cached && time) {
        setCrinzMessage(cached);
        setLastRoastTime(time);
        setShowTile(true);
      } else {
        getCrinzMessage(false);
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
        getCrinzMessage(true);
        lastHourRef.current = hour;
      }
    };

    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [autoMode, auth.isAuthenticated, auth.user?.access_token]);

  return {
    auth,
    crinzMessage,
    showTile,
    isFetching,
    autoMode,
    lastRoastTime,
    showToast,
    fetchCount,
    toggleAutoMode,
    getCrinzMessage,
  };
}
