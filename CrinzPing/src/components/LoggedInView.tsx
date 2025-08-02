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
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "1.5rem",
      marginTop: "2rem",
      padding: "0 1rem"
    }}>
      {showTile && (
        <div style={{
          width: "100%",
          maxWidth: "700px",
          background: "rgba(40, 40, 40, 0.6)",
          backdropFilter: "blur(4px)",
          borderRadius: "12px",
          border: "1px solid #333",
          boxShadow: "0 0 20px rgba(0,255,100,0.08)",
          textAlign: "center",
          fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
          position: "relative",
          padding: "2rem 1.5rem"
        }}>
          <div style={{ marginBottom: "1rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {crinzMessage}
          </div>

          <button
            onClick={() => getCrinzMessage(false)}
            disabled={isFetching}
            style={{
              position: "absolute",
              top: "-12px",
              right: "-12px",
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid #00ffcc",
              borderRadius: "50%",
              cursor: isFetching ? "not-allowed" : "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "38px",
              height: "38px",
              boxShadow: "0 0 10px rgba(0,255,100,0.3)",
              transition: "background 0.3s ease"
            }}
          >
            <span
              role="img"
              aria-label="refresh"
              style={{
                fontSize: "1.4rem",
                color: "#00ffcc",
                opacity: isFetching ? 0.5 : 1,
                transition: "transform 0.3s ease",
                transform: isFetching ? "rotate(180deg)" : "none"
              }}
            >
              🔄
            </span>
          </button>

          <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#888" }}>
            Last Crinz at: {lastRoastTime || "—"}
          </div>
          <div style={{ marginTop: "0.4rem", fontSize: "0.85rem", color: "#888" }}>
            Total Crinz pulls: {fetchCount}
          </div>
        </div>
      )}

      <label style={{
        fontSize: "clamp(0.9rem, 2vw, 1rem)",
        color: "#00ffcc",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem"
      }}>
        <input type="checkbox" checked={autoMode} onChange={toggleAutoMode} />
        Auto Mode (6 / 12 / 18 hrs)
      </label>

      {showToast && (
        <div style={{
          position: "fixed",
          bottom: "10px",
          right: "10px",
          left: "10px",
          maxWidth: "280px",
          margin: "0 auto",
          backgroundColor: "#121212",
          color: "#00ffcc",
          padding: "12px 18px",
          borderRadius: "8px",
          boxShadow: "0 4px 10px rgba(0,255,100,0.2)",
          fontWeight: "bold",
          borderLeft: "4px solid #00ffcc",
          textAlign: "center"
        }}>
          Crinz dropped automatically 💣
        </div>
      )}
    </div>
  );
}

export default LoggedInView;
