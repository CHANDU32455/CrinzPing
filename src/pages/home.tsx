import { useEffect, useState, useRef } from "react";
import { useCrinzLogic, type CrinzResponse } from "../hooks/useCrinzLogic";
import LoggedInView from "../components/LoggedInView";
import LoggedOutView from "../components/LoggedOutView";
import { HomeSeo } from "../components/Seo";

function Home() {
  const {
    auth,
    crinzData,
    showTile,
    isFetching,
    autoMode,
    toggleAutoMode,
    getCrinzMessage,
  } = useCrinzLogic();

  const [localCrinz, setLocalCrinz] = useState<CrinzResponse | null>(null);
  const fetchedOnce = useRef(false);

  const fetchCrinzIfNeeded = async (
    reason: "empty" | "manual" | "time" | "auto"
  ): Promise<CrinzResponse | null> => {
    const cached = localStorage.getItem("crinz_cache");

    const shouldFetch =
      reason === "manual" || reason === "time" || !cached;

    if (shouldFetch) {
      const data = await getCrinzMessage();
      if (data) setLocalCrinz(data);
      return data || null;
    } else {
      const cachedObj = cached ? JSON.parse(cached) : null;
      setLocalCrinz(cachedObj);
      return cachedObj;
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

  return (
    <div className="app-container home-container">
      <HomeSeo />
      {auth.isLoading ? (
        <div>Loading...</div>
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
        />
      ) : (
        <LoggedOutView />
      )}
    </div>
  );
}

export default Home;
