import { useEffect, useState, useRef } from "react";
import { useCrinzLogic, type CrinzResponse } from "../hooks/useCrinzLogic";
import LoggedInView from "../components/auth/LoggedInView";
import LoggedOutView from "../components/auth/LoggedOutView";
import { HomeSeo } from "../components/shared/Seo";
import { useCache } from "../context/CacheContext";
import CrinzLoader from "../components/shared/CrinzLoader";

function Home() {
  const {
    auth,
    crinzData,
    showTile,
    isFetching,
    autoMode,
    toggleAutoMode,
    getCrinzMessage,
    likeCrinz,
    updateCrinzCache
  } = useCrinzLogic();

  const { getItem } = useCache();
  const [localCrinz, setLocalCrinz] = useState<CrinzResponse | null>(null);
  const fetchedOnce = useRef(false);

  const fetchCrinzIfNeeded = async (
    reason: "empty" | "manual" | "time" | "auto"
  ): Promise<CrinzResponse | null> => {
    // Use CacheContext via useCrinzLogic or directly if needed, 
    // but useCrinzLogic handles the main fetching and caching.
    // Here we just want to ensure we display what's available.

    // If reason is manual, we force fetch via getCrinzMessage
    if (reason === "manual") {
      const data = await getCrinzMessage();
      if (data) setLocalCrinz(data);
      return data;
    }

    // Otherwise rely on what useCrinzLogic provides or cache
    const cached = getItem<CrinzResponse>("crinz_cache");

    if (cached) {
      setLocalCrinz(cached);
      return cached;
    } else {
      // If no cache and we need to fetch
      const data = await getCrinzMessage();
      if (data) setLocalCrinz(data);
      return data;
    }
  };

  useEffect(() => {
    if (!auth.isAuthenticated || fetchedOnce.current) return;
    fetchedOnce.current = true;
    fetchCrinzIfNeeded("empty");
  }, [auth.isAuthenticated]);

  useEffect(() => {
    if (crinzData) {
      setLocalCrinz(crinzData);
    }
  }, [crinzData]);
  const manualRefreshCrinz = async () => {
    const data = await fetchCrinzIfNeeded("manual");
    return data ? data : null;
  };

  const handleLike = () => {
    if (!localCrinz) return;
    likeCrinz(localCrinz.crinzId);
  };

  const handleCommentUpdate = (newCount: number) => {
    if (!localCrinz) return;
    const updated = { ...localCrinz, commentCount: newCount };
    setLocalCrinz(updated);
    updateCrinzCache(updated);
  };

  return (
    <div className="app-container home-container">
      <HomeSeo />
      {auth.isLoading ? (
        <CrinzLoader text="Authenticating..." />
      ) : auth.error ? (
        <div>Error: {typeof auth.error === "string" ? auth.error : auth.error?.message}</div>
      ) : auth.isAuthenticated ? (
        <LoggedInView
          crinzData={localCrinz}
          showTile={showTile}
          isFetching={isFetching}
          autoMode={autoMode}
          toggleAutoMode={toggleAutoMode}
          getCrinzMessage={manualRefreshCrinz}
          onLike={handleLike}
          onCommentUpdate={handleCommentUpdate}
        />
      ) : (
        <LoggedOutView />
      )}
    </div>
  );
}

export default Home;
