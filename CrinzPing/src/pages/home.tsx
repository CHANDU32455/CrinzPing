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
    toggleAutoMode,
    getCrinzMessage
  } = useCrinzLogic();

  // persistent Crinz pull count
  const [crinzPulls, setCrinzPulls] = useState<number>(() => {
    const saved = localStorage.getItem("crinzPulls");
    return saved ? parseInt(saved) : 0;
  });

  // flag to fetch only once per mount
  const fetchedOnce = useRef(false);

  // store tokens locally when authenticated
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id_token && auth.user?.access_token) {
      setAuthData(auth.user as any);
    } else {
      clearAuthData();
    }
  }, [auth.isAuthenticated, auth.user]);

  // fetch new Crinz once on mount
  useEffect(() => {
    if (auth.isAuthenticated && !fetchedOnce.current) {
      getCrinzMessage(false);
      fetchedOnce.current = true;
    }
  }, [auth.isAuthenticated, getCrinzMessage]);

  // increment Crinz pull count whenever a new Crinz is received
  useEffect(() => {
    if (!crinzMessage) return;

    setCrinzPulls(prev => {
      const updated = prev + 1;
      localStorage.setItem("crinzPulls", updated.toString());
      return updated;
    });

    // log the new Crinz to console
    console.log("New Crinz received:", crinzMessage);
  }, [crinzMessage]);

  return (
    <div className="app-container home-container">
      {auth.isLoading ? (
        <div>Loading...</div>
      ) : auth.error ? (
        <div>Error: {auth.error.message}</div>
      ) : auth.isAuthenticated ? (
        <LoggedInView
          crinzMessage={crinzMessage}
          showTile={showTile}
          isFetching={isFetching}
          autoMode={autoMode}
          lastRoastTime={lastRoastTime}
          showToast={false} // toast removed
          fetchCount={crinzPulls} // pass the persistent count
          toggleAutoMode={toggleAutoMode}
          getCrinzMessage={getCrinzMessage}
        />
      ) : (
        <LoggedOutView />
      )}
    </div>
  );
}

export default Home;
