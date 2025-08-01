function LoggedInView({
  crinzMessage,
  showTile,
  isFetching,
  autoMode,
  lastRoastTime,
  showToast,
  fetchCount,
  toggleAutoMode,
  getCrinzMessage
}: {
  crinzMessage: string;
  showTile: boolean;
  isFetching: boolean;
  autoMode: boolean;
  lastRoastTime: string;
  showToast: boolean;
  fetchCount: number;
  toggleAutoMode: () => void;
  getCrinzMessage: (showToastMode: boolean) => void;
}) {
  return (
    <>
      {showTile && (
        <div style={{
          padding: "2rem",
          maxWidth: "700px",
          background: "rgba(40, 40, 40, 0.6)",
          backdropFilter: "blur(4px)",
          borderRadius: "12px",
          border: "1px solid #333",
          boxShadow: "0 0 20px rgba(0,255,100,0.08)",
          textAlign: "center",
          fontSize: "1.1rem",
          position: "relative"
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
          <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#888" }}>
            Last Crinz at: {lastRoastTime || "—"}
          </div>
          <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#888" }}>
            Total Crinz pulls: {fetchCount}
          </div>
        </div>
      )}

      <label style={{
        marginTop: "2rem",
        fontSize: "1rem",
        color: "#00ffcc"
      }}>
        <input type="checkbox" checked={autoMode} onChange={toggleAutoMode} style={{ marginRight: "8px" }} />
        Auto Mode (6 / 12 / 18 hrs)
      </label>

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
  );
}

export default LoggedInView;
