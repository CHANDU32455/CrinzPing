import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_GET_USER_DETAILS_API_URL;

export const useUserDetails = () => {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Missing access token");
      return;
    }

    const cached = sessionStorage.getItem("user_details");
    const cachedToken = sessionStorage.getItem("user_details_token");

    // ✅ If cached and token matches, use it
    if (cached && cachedToken === token) {
      setUserDetails(JSON.parse(cached));
      return;
    }

    // Otherwise fetch from API
    const fetchDetails = async () => {
      try {
        const response = await axios.get(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserDetails(response.data);

        // Cache user details for the session
        sessionStorage.setItem("user_details", JSON.stringify(response.data));
        sessionStorage.setItem("user_details_token", token);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || "Failed to fetch user details");
      }
    };

    fetchDetails();
  }, []);

  return { userDetails, error, refreshUserDetails: async () => {
    // force refresh from API (e.g. after editing profile)
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserDetails(response.data);
      sessionStorage.setItem("user_details", JSON.stringify(response.data));
      sessionStorage.setItem("user_details_token", token);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to refresh user details");
    }
  }};
};
