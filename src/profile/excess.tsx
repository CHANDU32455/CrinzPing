import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { useDeleteUserAccount } from "../hooks/useDeleteUserAccount";

// About Tab Component
export function About() {
  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-purple-400">ABOUT & HELP</h3>
        <p className="text-gray-400 mt-2">Learn more about Crinz and get support</p>
      </div>
      
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <h4 className="text-lg font-semibold text-purple-300 mb-4">About Crinz</h4>
          <p className="text-gray-300 mb-4">The place where real cringers connect and share spicy takes.</p>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400">Version</span>
              <span className="text-purple-300 font-semibold">1.0.0</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400">Build</span>
              <span className="text-purple-300 font-semibold">2024.12.01</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <h4 className="text-lg font-semibold text-purple-300 mb-4">Support</h4>
          <div className="space-y-3">
            <a href="mailto:support@crinz.com" className="flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all border border-gray-700 hover:border-purple-500/30">
              <div className="flex items-center space-x-3">
                <span className="text-xl">📧</span>
                <span className="font-semibold">Contact Support</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <a href="/help" className="flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all border border-gray-700 hover:border-purple-500/30">
              <div className="flex items-center space-x-3">
                <span className="text-xl">📖</span>
                <span className="font-semibold">Help Center</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <h4 className="text-lg font-semibold text-purple-300 mb-4">Legal</h4>
          <div className="space-y-3">
            <Link to="/terms" className="flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all border border-gray-700 hover:border-purple-500/30">
              <div className="flex items-center space-x-3">
                <span className="text-xl">📄</span>
                <span className="font-semibold">Terms of Service</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/privacy" className="flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all border border-gray-700 hover:border-purple-500/30">
              <div className="flex items-center space-x-3">
                <span className="text-xl">🔏</span>
                <span className="font-semibold">Privacy Policy</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings Tab Component
export function Settings() {
  const auth = useAuth();
  const [showExportChip, setShowExportChip] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const { deleteUserAccount } = useDeleteUserAccount();

  const handleExportData = () => {
    setShowExportChip(true);
    setTimeout(() => setShowExportChip(false), 3000);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteUserAccount(auth.user?.profile?.sub, auth.user?.access_token);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-purple-400">SETTINGS</h3>
        <p className="text-gray-400 mt-2">Manage your account and data</p>
      </div>
      
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <h4 className="text-lg font-semibold text-purple-300 mb-4">Data Management</h4>
          
          <div className="space-y-4">
            <button 
              onClick={handleExportData}
              className="w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-xl text-left transition-all border border-gray-700 hover:border-purple-500/30"
            >
              <div className="flex items-center space-x-4">
                <span className="text-2xl">📥</span>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-white">Export My Data</div>
                  <div className="text-gray-400 text-sm">Download all your crinz data</div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <button 
              onClick={() => setShowDeleteModal(true)}
              className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-left transition-all border border-red-500/30 hover:border-red-500/50"
            >
              <div className="flex items-center space-x-4">
                <span className="text-2xl">🗑️</span>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-red-400">Delete Account</div>
                  <div className="text-gray-400 text-sm">Permanently delete your account and data</div>
                </div>
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Export Chip */}
      {showExportChip && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-bounce">
          📥 Export coming soon!
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-red-500/30 shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="text-xl font-bold text-red-400">Delete Account?</h3>
            </div>
            <p className="text-gray-300 text-center mb-6">
              This will permanently delete your account and all your data. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}