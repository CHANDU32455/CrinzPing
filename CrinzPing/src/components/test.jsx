import { useAuth } from "react-oidc-context";
import { useEffect, useState } from "react";

function Home() {
  const auth = useAuth();
  const [crinzMessage, setCrinzMessage] = useState("");
  const [showTile, setShowTile] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [lastRoastTime, setLastRoastTime] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [fetchCount, setFetchCount] = useState(0);


  const appDescription = "Crinz spits brutal dev roasts at 6AM, 12PM, 6PM. Crafted with love, optimized for shame. Get in, get burned, get better.";
  const topButtonStyle = {
    fontFamily: "'Fira Code', monospace",
    padding: "8px 16px",
    backgroundColor: "#111",
    color: "#00ffcc",
    border: "1px solid #00ffcc",
    borderRadius: "4px",
    cursor: "pointer"
  };

  useEffect(() => {
    const cached = localStorage.getItem("crinz_cache");
    const cachedTime = localStorage.getItem("crinz_last_time");
    const cachedAuto = localStorage.getItem("crinz_auto_enabled");

    if (cached) {
      setCrinzMessage(cached);
      setShowTile(true);
    }
    if (cachedTime) setLastRoastTime(cachedTime);
    if (cachedAuto === "false") setAutoMode(false);
  }, []);

  useEffect(() => {
    let lastFetchedHour: number | null = null;
    const checkAndFetch = () => {
      if (!autoMode) return;
      const hour = new Date().getHours();
      const targetHours = [6, 12, 18];
      if (targetHours.includes(hour) && lastFetchedHour !== hour) {
        getCrinzMessage(true);
        lastFetchedHour = hour;
      }
    };
    const interval = setInterval(checkAndFetch, 60000);
    return () => clearInterval(interval);
  }, [autoMode, auth.user?.access_token]);

  const getCrinzMessage = async (showToastMode = false) => {
    try {
      setIsFetching(true);
      const token = auth.user?.access_token;
      const response = await fetch(import.meta.env.VITE_CRINZ_API_URL, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json();
      const timeString = new Date().toLocaleTimeString();

      setCrinzMessage(data.message);
      setLastRoastTime(timeString);
      setShowTile(true);
      setFetchCount(prev => prev + 1);


      localStorage.setItem("crinz_cache", data.message);
      localStorage.setItem("crinz_last_time", timeString);
      if (showToastMode) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error("Crinz fetch error:", error);
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

  return (
    <div style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#0d0d0d",
      fontFamily: "'Fira Code', monospace",
      color: "#e0e0e0",
      padding: "2rem"
    }}>
      {/* 🔐 Top-right Auth Button */}
      <div style={{ position: "absolute", top: "20px", right: "20px" }}>
        {auth.isAuthenticated ? (
          <button onClick={() => auth.removeUser()} style={topButtonStyle}>Sign out</button>
        ) : (
          <button onClick={() => auth.signinRedirect()} style={topButtonStyle}>Sign in</button>
        )}
      </div>

      {/* ⬇️ Authenticated or Guest View */}
      {auth.isLoading ? (
        <div>Loading...</div>
      ) : auth.error ? (
        <div>Error: {auth.error.message}</div>
      ) : auth.isAuthenticated ? (
        <>
        {console.log(auth.user?.access_token)}
          {/* 🧱 Roast Display Tile */}
          <div style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            fontFamily: "'Fira Code', monospace",
            fontSize: "1.2rem",
            fontWeight: "bold",
            color: "#00ffcc",
            userSelect: "none"
          }}>
            CrinzPing 🔥
          </div>
          {showTile && (
            <div style={{
              marginTop: "4rem",
              padding: "2rem",
              maxWidth: "700px",
              background: "rgba(40, 40, 40, 0.6)",
              backdropFilter: "blur(4px)",
              borderRadius: "12px",
              border: "1px solid #333",
              boxShadow: "0 0 20px rgba(0,255,100,0.08)",
              textAlign: "center",
              fontSize: "1.1rem"
            }}>

              {crinzMessage}
              <button onClick={() => getCrinzMessage(false)} disabled={isFetching} style={{
                position: "absolute",
                top: "-20px",
                right: "-20px",
                background: "transparent",
                border: "none",
                cursor: "pointer"
              }}>
                <span role="img" aria-label="refresh" style={{
                  fontSize: "1.5rem",
                  color: "#00ffcc",
                  opacity: isFetching ? 0.5 : 1,
                  transition: "transform 0.3s",
                  transform: isFetching ? "rotate(180deg)" : "none"
                }}>🔄</span>
              </button>
              <div style={{
                marginTop: "1rem",
                fontSize: "0.85rem",
                color: "#888"
              }}>
                Last Crinz at: {lastRoastTime || "—"}
              </div>
              <div style={{
                marginTop: "0.5rem",
                fontSize: "0.85rem",
                color: "#888"
              }}>
                Total Crinz pulls: {fetchCount}
              </div>

            </div>
          )}

          {/* 🔘 Auto Toggle */}
          <label style={{
            marginTop: "2rem",
            fontSize: "1rem",
            color: "#00ffcc"
          }}>
            <input type="checkbox" checked={autoMode} onChange={toggleAutoMode} style={{ marginRight: "8px" }} />
            Auto Mode (6 / 12 / 18 hrs)
          </label>

          {/* 💣 Toast */}
          {showToast && (
            <div style={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
              backgroundColor: "#121212",
              color: "#00ffcc",
              padding: "12px 18px",
              borderRadius: "8px",
              boxShadow: "0 4px 10px rgba(0,255,100,0.2)",
              fontWeight: "bold",
              borderLeft: "4px solid #00ffcc"
            }}>
              Crinz dropped automatically 💣
            </div>
          )}
        </>
      ) : (
        // 📄 Logged-out Description
        <div style={{
          marginTop: "6rem",
          maxWidth: "700px",
          backgroundColor: "#121212",
          border: "1px solid #333",
          borderRadius: "12px",
          padding: "2rem",
          boxShadow: "0 0 20px rgba(0,255,100,0.05)",
          textAlign: "center",
          fontSize: "1rem",
          color: "#00ffcc"
        }}>
          {appDescription}
        </div>
      )}
    </div>
  );
}

export default Home;
