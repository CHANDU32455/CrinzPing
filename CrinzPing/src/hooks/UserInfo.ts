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

    const fetchDetails = async () => {
      try {
        const response = await axios.get(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserDetails(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || "Failed to fetch user details");
      }
    };

    fetchDetails();
  }, []);

  return { userDetails, error };
};
