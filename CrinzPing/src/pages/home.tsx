import { useEffect, useState, useRef } from "react";
import { useCrinzLogic } from "../hooks/useCrinzLogic";
import LoggedInView from "../components/LoggedInView";
import LoggedOutView from "../components/LoggedOutView";
import { setAuthData, clearAuthData } from "../utils/useAuthStore";

function Home() {
  const {
    auth,
    crinzMessage,
    showTile,
    isFetching,
    autoMode,
    lastRoastTime,
    showToast,
    toggleAutoMode,
    getCrinzMessage
  } = useCrinzLogic();

  const [localCrinz, setLocalCrinz] = useState<string>("");
  const [crinzPulls, setCrinzPulls] = useState<number>(() => {
    const saved = localStorage.getItem("crinzPulls");
    return saved ? parseInt(saved) : 0;
  });

  const fetchedOnce = useRef(false);

  /** Save tokens locally when authenticated */
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id_token && auth.user?.access_token) {
      setAuthData(auth.user as any);
    } else {
      clearAuthData();
    }
  }, [auth.isAuthenticated, auth.user]);

  /** Increment pull count & store */
  const incrementPulls = () => {
    setCrinzPulls(prev => {
      const updated = prev + 1;
      localStorage.setItem("crinzPulls", updated.toString());
      return updated;
    });
  };

  /** Centralized fetch logic */
  const fetchCrinzIfNeeded = async (reason: "empty" | "manual" | "time" | "auto") => {
    const cached = localStorage.getItem("crinz_cache");
    const cachedTime = localStorage.getItem("crinz_last_time");

    const shouldFetch =
      reason === "manual" || reason === "time" || !cached || !cachedTime;

    if (shouldFetch) {
      await getCrinzMessage(reason !== "auto"); // toast for manual/time, silent for auto
      incrementPulls();
    } else {
      setLocalCrinz(cached || "");
    }
  };

  /** On mount: try cache first */
  useEffect(() => {
    if (!auth.isAuthenticated || fetchedOnce.current) return;
    fetchedOnce.current = true;
    fetchCrinzIfNeeded("empty");
  }, [auth.isAuthenticated]);

  /** Sync with crinzMessage from hook */
  useEffect(() => {
    if (crinzMessage) {
      setLocalCrinz(crinzMessage);
    }
  }, [crinzMessage]);

  /** Manual refresh for button */
  const manualRefreshCrinz = async () => {
    await fetchCrinzIfNeeded("manual");
    return localStorage.getItem("crinz_cache") || "";
  };

  return (
    <div className="app-container home-container">
      {auth.isLoading ? (
        <div>Loading...</div>
      ) : auth.error ? (
        <div>Error: {auth.error.message}</div>
      ) : auth.isAuthenticated ? (
        <LoggedInView
          crinzMessage={localCrinz}
          showTile={showTile}
          isFetching={isFetching}
          autoMode={autoMode}
          lastRoastTime={lastRoastTime}
          showToast={showToast}
          fetchCount={crinzPulls}
          toggleAutoMode={toggleAutoMode}
          getCrinzMessage={manualRefreshCrinz}
        />
      ) : (
        <LoggedOutView />
      )}
    </div>
  );
}

export default Home;
