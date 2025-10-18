import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import BaseProfileView from "./BaseProfileView";
import { decodePostData } from "../utils/encodeDecode";
import { type UserDetails, type CrinzMessage } from "../hooks/UserInfo";
import { useAuth } from "react-oidc-context";

const PublicProfileEncodedView: React.FC = () => {
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const encoded = searchParams.get("data");
  if (!encoded) return <p>No data to show</p>;

  const decoded = decodePostData<{ userDetails: UserDetails; crinzMessages: CrinzMessage[] }>(encoded);
  if (!decoded) return <p>Invalid or corrupted data</p>;

  // ✅ redirect handled safely in useEffect
  useEffect(() => {
    if (auth.isAuthenticated && decoded.userDetails.userId) {
      navigate(`/profile/${decoded.userDetails.userId}`);
    }
  }, [auth.isAuthenticated, decoded.userDetails.userId, navigate]);

  const handlePostClick = () => setShowLoginModal(true);
  const handleLogin = () => {
    localStorage.removeItem("manual_logout");
    auth.signinRedirect();
  };
  const handleCancel = () => setShowLoginModal(false);

  const modalOverlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: "#2d2a2aff",
    padding: "20px",
    borderRadius: "10px",
    width: "300px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  };

  const buttonStyle: React.CSSProperties = {
    margin: "10px",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  };
  
  return (
    <>
      <BaseProfileView
        userDetails={decoded.userDetails}
        crinzMessages={decoded.crinzMessages}
        loadingUser={false}
        loadingCrinz={false}
        allowActions={false}
        showEdit={false}
        showSignout={false}
        onPostClick={handlePostClick}
      />
      {showLoginModal && (
        <div style={modalOverlayStyle} onClick={handleCancel}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: "10px" }}>Login Required</h2>
            <p style={{ marginBottom: "20px" }}>You must be logged in to perform this action.</p>
            <div>
              <button
                style={{ ...buttonStyle, backgroundColor: "#4CAF50", color: "#fff" }}
                onClick={handleLogin}
              >
                Login
              </button>
              <button
                style={{ ...buttonStyle, backgroundColor: "#4f4d4dff", color: "#f9f9f9ff" }}
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PublicProfileEncodedView;
