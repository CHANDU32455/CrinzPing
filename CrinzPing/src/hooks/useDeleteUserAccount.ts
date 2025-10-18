import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const DELETE_ACCOUNT_API = `${import.meta.env.VITE_BASE_API_URL}/deleteUserAccount`;

function clearAllCookies() {
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
  });
}

export function useDeleteUserAccount() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const navigate = useNavigate();

  const deleteUserAccount = useCallback(
    async (sub: string | undefined, accessToken: string | undefined) => {
      if (!accessToken) {
        setDeleteError("No access token provided");
        return { success: false };
      }

      setIsDeleting(true);
      setDeleteError(null);

      try {
        const response = await axios.post(
          DELETE_ACCOUNT_API,
          { sub },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 200) {
          // cleanup
          localStorage.clear();
          sessionStorage.clear();
          clearAllCookies();

          // navigate to goodbye
          navigate("/goodbye", { replace: true });

          // reload only after navigation finishes
          Promise.resolve().then(() => {
            window.location.reload(); // 🔄 hard refresh
          });

          return { success: true, data: response.data };
        }

        return { success: false, data: response.data };
      } catch (error: any) {
        console.error("❌ account deletion failed:", error);
        const message =
          error.response?.data?.message ||
          error.message ||
          "Failed to delete account";
        setDeleteError(message);
        return { success: false, error: message };
      } finally {
        setIsDeleting(false);
      }
    },
    [navigate]
  );

  return { deleteUserAccount, isDeleting, deleteError };
}
