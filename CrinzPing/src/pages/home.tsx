import { useEffect } from "react";
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
    fetchCount,
    toggleAutoMode,
    getCrinzMessage
  } = useCrinzLogic();

  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id_token && auth.user?.access_token) {
      setAuthData(auth.user as any); // store everything including cognito:username
    } else if (!auth.isAuthenticated) {
      clearAuthData(); // cleanup on logout
    }
  }, [auth.isAuthenticated, auth.user]);

  return (
    <div className="app-container home-container">
      {auth.isLoading ? (
        <div>Loading...</div>
      ) : auth.error ? (
        <div>Error: {auth.error.message}</div>
      ) : auth.isAuthenticated ? (
        <>
          <LoggedInView
            crinzMessage={crinzMessage}
            showTile={showTile}
            isFetching={isFetching}
            autoMode={autoMode}
            lastRoastTime={lastRoastTime}
            showToast={showToast}
            fetchCount={fetchCount}
            toggleAutoMode={toggleAutoMode}
            getCrinzMessage={getCrinzMessage}
          />
        </>
      ) : (
        <LoggedOutView />
      )}
    </div>
  );
}

export default Home;
