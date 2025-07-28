import { useEffect, useState } from "react";
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

  const getCrinzMessage = async (toast = false) => {
    try {
      setIsFetching(true);
      const token = auth.user?.access_token;
      const res = await fetch(import.meta.env.VITE_CRINZ_API_URL, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const { message } = await res.json();

      const now = new Date().toLocaleTimeString();
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

  useEffect(() => {
    const cached = localStorage.getItem("crinz_cache");
    const time = localStorage.getItem("crinz_last_time");
    const auto = localStorage.getItem("crinz_auto_enabled");
    if (cached) {
      setCrinzMessage(cached);
      setShowTile(true);
    }
    if (time) setLastRoastTime(time);
    if (auto === "false") setAutoMode(false);
  }, []);

  useEffect(() => {
    let lastHour: number | null = null;
    const check = () => {
      if (!autoMode) return;
      const hour = new Date().getHours();
      const targets = [6, 12, 18];
      if (targets.includes(hour) && lastHour !== hour) {
        getCrinzMessage(true);
        lastHour = hour;
      }
    };
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [autoMode, auth.user?.access_token]);

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
