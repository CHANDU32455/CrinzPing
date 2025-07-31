import { useEffect } from "react";
import { useCrinzLogic } from "../hooks/useCrinzLogic";
import LoggedInView from "../components/LoggedInView";
import LoggedOutView from "../components/LoggedOutView";
import AuthButton from "../components/AuthButton";

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

  const appDescription =
    "Crinz spits brutal dev roasts at 6AM, 12PM, 6PM. Crafted with love, optimized for shame. Get in, get burned, get better.";

  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id_token) {
      localStorage.setItem("id_token", auth.user.id_token);
    }
  }, [auth.isAuthenticated, auth.user]);

  return (
    <div className="app-container home-container">
      <AuthButton />

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
          {console.log(auth.user)}
        </>
      ) : (
        <LoggedOutView appDescription={appDescription} />
      )}
    </div>
  );
}

export default Home;
