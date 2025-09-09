import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import ProfilePage from "../profile/ProfilePage";
import SignOutButton from "../components/SignOutButton";
import { useDeleteUserAccount, } from "../hooks/useDeleteUserAccount";
import "../css/Extras.css";

const Extras: React.FC = () => {
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showExportChip, setShowExportChip] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { deleteUserAccount, deleteError } = useDeleteUserAccount();
  const [deleting, setDeleting] = useState(false);


  // Get active tab from query params or default to "profile"
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "profile");

  // Update URL when tab changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (activeTab === "profile") {
      params.delete("tab");
    } else {
      params.set("tab", activeTab);
    }
    setSearchParams(params);
  }, [activeTab, searchParams, setSearchParams]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const currentTab = searchParams.get("tab") || "profile";
    setActiveTab(currentTab);
  }, [searchParams]);

  // Close mobile menu when tab changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  // Auto-hide export chip after 3 seconds
  useEffect(() => {
    if (showExportChip) {
      const timer = setTimeout(() => {
        setShowExportChip(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showExportChip]);

  const handleExportData = () => {
    setShowExportChip(true);
    console.log("Data export requested by user");
  };

const handleDeleteAccountClick = async () => {
  if (!deleteConfirm) {
    setDeleteConfirm(true);
    setShowDeleteModal(true);
    return;
  }

  try {
    console.log("✅ account deletion confirmed");
    setDeleting(true); // start deleting

    const result = await deleteUserAccount(
      auth?.user?.profile?.sub,
      auth?.user?.access_token
    );

    if (!result.success) {
      console.error("❌ deletion failed:", result.error);
    } else {
      console.log("🗑️ deletion success!");
    }
  } finally {
    setDeleting(false); // reset states
    setDeleteConfirm(false);
    setShowDeleteModal(false);
  }
};

  const handleCancelDelete = () => {
    setDeleteConfirm(false);
    setShowDeleteModal(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setDeleteConfirm(false);
    setShowDeleteModal(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Delete Confirmation Modal Component
  const DeleteConfirmationModal = () => {
    if (!showDeleteModal) return null;

    const modalStyle: React.CSSProperties = {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    };

    const modalContentStyle: React.CSSProperties = {
      backgroundColor: '#2a2a3d',
      padding: '25px',
      borderRadius: '12px',
      maxWidth: '400px',
      width: '90%',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
    };

    const titleStyle: React.CSSProperties = {
      color: '#ff6b6b',
      marginBottom: '15px',
      fontSize: '20px',
      fontWeight: '600',
    };

    const messageStyle: React.CSSProperties = {
      color: '#f5f5f5',
      marginBottom: '20px',
      lineHeight: '1.5',
    };

    const buttonContainerStyle: React.CSSProperties = {
      display: 'flex',
      gap: '15px',
      justifyContent: 'flex-end',
    };

    const buttonStyle: React.CSSProperties = {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'background-color 0.2s ease',
    };

    const cancelButtonStyle: React.CSSProperties = {
      ...buttonStyle,
      backgroundColor: '#3a3a52',
      color: '#f5f5f5',
    };

    const confirmButtonStyle: React.CSSProperties = {
      ...buttonStyle,
      backgroundColor: '#ff4757',
      color: 'white',
    };

    return (
      <div style={modalStyle} onClick={handleCancelDelete}>
        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
          <h3 style={titleStyle}>⚠️ Confirm Account Deletion</h3>
          <p style={messageStyle}>
            Are you sure you want to delete your account? This action cannot be undone.
            All your data, including your profile, crinz messages, and preferences will be
            permanently deleted.
          </p>
          <div style={buttonContainerStyle}>
            <button
              style={cancelButtonStyle}
              onClick={handleCancelDelete}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4a4a62'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3a3a52'}
            >
              Cancel
            </button>
            <button
              style={confirmButtonStyle}
              onClick={handleDeleteAccountClick}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ff5e6b'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff4757'}
              disabled={deleting}
            >
              {deleting ? "⏳ Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Export Chip Component
  const ExportChip = () => {
    if (!showExportChip) return null;

    const chipStyle: React.CSSProperties = {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#3a86ff',
      color: 'white',
      padding: '10px 16px',
      borderRadius: '20px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      zIndex: 100,
      animation: 'fadeInOut 3s ease-in-out',
    };

    return (
      <div style={chipStyle}>
        📥 Data export feature coming soon!
      </div>
    );
  };

  return (
    <div className="extras-container">
      {/* Mobile Header with Hamburger */}
      <div className="extras-mobile-header">
        <button
          className="extras-hamburger-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span className="extras-hamburger-line"></span>
          <span className="extras-hamburger-line"></span>
          <span className="extras-hamburger-line"></span>
        </button>
        <h2 className="extras-mobile-title">Extras</h2>
      </div>

      {/* Sidebar */}
      <div className={`extras-sidebar ${isMobileMenuOpen ? 'extras-sidebar-open' : ''}`}>
        <h2 className="extras-sidebar-title">Extras</h2>

        <nav className="extras-sidebar-nav">
          <button
            className={`extras-nav-item ${activeTab === "profile" ? "extras-active" : ""}`}
            onClick={() => handleTabChange("profile")}
          >
            👤 My Profile
          </button>
          <button
            className={`extras-nav-item ${activeTab === "settings" ? "extras-active" : ""}`}
            onClick={() => handleTabChange("settings")}
          >
            ⚙️ Settings
          </button>
          <button
            className={`extras-nav-item ${activeTab === "about" ? "extras-active" : ""}`}
            onClick={() => handleTabChange("about")}
          >
            ℹ️ About & Help
          </button>
        </nav>

        <div className="extras-sidebar-footer">
          <p className="extras-user-email">{auth.user?.profile?.email}</p>
          <SignOutButton />
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="extras-mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Content Area */}
      <div className="extras-content">
        <div style={{ display: activeTab === "profile" ? "block" : "none" }}>
          <ProfilePage />
        </div>
        <div style={{ display: activeTab === "settings" ? "block" : "none" }}>
          {/* settings content */}
          <div className="extras-settings-content">
            <div className="extras-settings-section">
              <h3>Data Management</h3>
              <button className="extras-settings-btn" onClick={handleExportData}>
                📥 Export My Data
              </button>
              <button
                className={`extras-settings-btn ${deleteConfirm ? "extras-delete-confirm" : "extras-delete"}`}
                onClick={handleDeleteAccountClick}
                disabled={deleting} // disable while deleting
              >
                {deleting
                  ? "⏳ Deleting..."
                  : deleteConfirm
                    ? "⚠️ Confirm Delete Account"
                    : "🗑️ Delete Account"}
                {deleteError && <span className="extras-delete-error">Error: {deleteError}</span>}
              </button>
              {deleteConfirm && (
                <p className="extras-delete-warning">
                  This action cannot be undone. All your data will be permanently deleted. Includes posts, likes, comments, follows, etc...
                </p>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: activeTab === "about" ? "block" : "none" }}>
          {/* about content */}
          <div className="extras-about-content">
            <div className="extras-about-section">
              <h3>About CrinzPing</h3>
              <p>Connect, share, and discover with the CrinzPing community.</p>
              <div className="extras-app-info">
                <div className="extras-info-item">
                  <span className="extras-label">Version:</span>
                  <span className="extras-value">1.0.0</span>
                </div>
                <div className="extras-info-item">
                  <span className="extras-label">Build:</span>
                  <span className="extras-value">2024.01.01</span>
                </div>
              </div>
            </div>
            <div className="extras-about-section">
              <h3>Support</h3>
              <a href="mailto:crinzping@gmail.com" className="extras-support-btn">📧 Contact Support</a>
              <a href="/help" className="extras-support-btn">📖 Help Center</a>
            </div>
            <div className="extras-about-section">
              <h3>Legal</h3>
              <Link to="/terms" className="extras-legal-btn">📄 Terms of Service</Link>
              <Link to="/privacySettings" className="extras-legal-btn">🔏 Privacy Policy</Link>
              <Link to="/about" className="extras-legal-btn">ℹ️ About</Link>
            </div>
          </div>
        </div>
      </div>


      {/* Export Chip */}
      <ExportChip />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />
    </div>
  );
};

export default Extras;