import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import ProfilePage from "../profile/ProfilePage";
import SignOutButton from "../components/SignOutButton";
import { useDeleteUserAccount } from "../hooks/useDeleteUserAccount";
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

  // get from query param OR localStorage OR default to "crinzmsgs"
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || localStorage.getItem("extrasActiveTab") || "crinzmsgs");

  // store last active tab in localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("extrasActiveTab", activeTab);
  }, [activeTab]);

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

  // Add a useEffect to lock body scroll when sidebar is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // cleanup in case component unmounts while menu is open
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);


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
      setDeleting(true);

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
      setDeleting(false);
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

    return (
      <div className="extras-modal-overlay" onClick={handleCancelDelete}>
        <div className="extras-modal-content" onClick={(e) => e.stopPropagation()}>
          <h3 className="extras-modal-title">⚠️ Confirm Account Deletion</h3>
          <p className="extras-modal-message">
            Are you sure you want to delete your account? This action cannot be undone.
            All your data, including your profile, crinz messages, and preferences will be
            permanently deleted.
          </p>
          <div className="extras-modal-buttons">
            <button
              className="extras-modal-cancel"
              onClick={handleCancelDelete}
            >
              Cancel
            </button>
            <button
              className="extras-modal-confirm"
              onClick={handleDeleteAccountClick}
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

    return (
      <div className="extras-export-chip">
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
          <div className="extras-settings-content">
            <div className="extras-settings-section">
              <h3>Data Management</h3>
              <button className="extras-settings-btn" onClick={handleExportData}>
                📥 Export My Data
              </button>
              <button
                className={`extras-settings-btn ${deleteConfirm ? "extras-delete-confirm" : "extras-delete"}`}
                onClick={handleDeleteAccountClick}
                disabled={deleting}
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
          <div className="extras-about-content">
            <div className="extras-about-section">
              <h3>About CrinzPing</h3>
              <p>Connect, share, and discover with the CrinzPing community.</p>
              <div className="extras-app-info">
                <div className="extras-info-item">
                  <span className="extras-label">Version:</span>
                  <span className="extras-value">1.0.1</span>
                </div>
                <div className="extras-info-item">
                  <span className="extras-label">Build:</span>
                  <span className="extras-value">2025.09.09</span>
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