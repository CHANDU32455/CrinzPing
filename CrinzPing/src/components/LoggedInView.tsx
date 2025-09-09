import { Link } from "react-router-dom";
import type { CrinzResponse } from "../hooks/useCrinzLogic";

interface Props {
  crinzData: CrinzResponse | null;
  showTile: boolean;
  isFetching: boolean;
  getCrinzMessage: () => Promise<CrinzResponse | null>;
  autoMode: boolean;
  toggleAutoMode: () => void;
}

function LoggedInView({
  crinzData,
  showTile,
  isFetching,
  getCrinzMessage,
  autoMode,
  toggleAutoMode,
}: Props) {
  if (!showTile || !crinzData) return null;

  const formatDate = (ts: string) => {
    const match = ts.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3})/);
    const dateObj = new Date(match ? match[1] : ts);
    return isNaN(dateObj.getTime()) ? "Invalid date" : dateObj.toLocaleString();
  };
  

  return (
    <div style={{ width: "100%", maxWidth: "600px", margin: "1rem auto" }}>
      <div className="crinz-post" style={{ position: "relative" }}>
        {/* Post header */}
        <div className="post-header">
          <Link
            to={`/profile/${crinzData.userId}`}
            style={{
              cursor: "pointer",
              color: "#00aaff",
              fontWeight: 600,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            @{crinzData.userName}
          </Link>
        </div>

        {/* Message */}
        <div className="post-message-container">
          <p className="post-message">{crinzData.message}</p>
          <div className="post-meta">
            <span>{formatDate(crinzData.timestamp)}</span>
          </div>
        </div>

        {/* Post actions */}
        <div className="post-actions">
          <span>👍 {crinzData.likeCount}</span>
        </div>

        {/* Refresh Button (absolute top-right) */}
        <button
          onClick={() => getCrinzMessage()}
          disabled={isFetching}
          className={isFetching ? "refresh-button spinning" : "refresh-button"}
        >
          🔄
        </button>
      </div>

      {/* Auto Mode Toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "1rem",
          marginBottom: "1rem",
        }}
      >
        <label
          style={{
            fontSize: "0.9rem",
            color: "#00ffcc",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(0,0,0,0.3)",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
          }}
        >
          <input type="checkbox" checked={autoMode} onChange={toggleAutoMode} />
          Auto Mode (6 / 12 / 18 hrs)
        </label>
      </div>

      {/* Inline styles for rotation */}
      <style>
        {`
          .refresh-button {
            position: absolute;
            top: -18px;
            right: -22px;
            background: rgba(0,0,0,0.5);
            border: 1px solid #00ffcc;
            border-radius: 30%;
            width: 32px;
            height: 32px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            color: #00ffcc;
          }

          .refresh-button:disabled {
            cursor: not-allowed;
          }

          .spinning {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default LoggedInView;
