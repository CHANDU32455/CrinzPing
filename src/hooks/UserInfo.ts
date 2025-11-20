import axios from "axios";
import { useState, useEffect, useCallback } from "react";

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;
``
// construct specific endpoints
const USER_API_URL = `${BASE_API_URL}/getUserDetails`;
const CRINZ_API_URL = `${BASE_API_URL}/fetchUserPosts`;

export interface CrinzMessage {
  crinzId: string;
  message: string;
  tags? : string[];
  likeCount?: number;
  commentCount?: number;
  timestamp?: string;
  userName?: string;
  isLikedByUser?: boolean;
}

export interface UserDetails {
  userId: string;
  displayName?: string;
  email: string;
  Tagline?: string;
  profilePic?: string; // base64 or URL
  profilePicPath?: string; // S3 path for future reference
  categories?: string[];
  [key: string]: any;
}

export interface CrinzResponse {
  posts: CrinzMessage[];
  lastKey?: string;
}

export const POSTS_PER_PAGE = 15;

// ---------- Module-level cache ----------
const userCache: Record<string, UserDetails> = {};
const crinzCache: Record<string, CrinzMessage[]> = {};
const lastKeyCache: Record<string, string | undefined> = {};

// ---------- Request deduplication ----------
let activeUserFetches: Map<string, Promise<UserDetails | void>> = new Map();
let activeCrinzFetches: Map<string, Promise<CrinzResponse | void>> = new Map();

// Helper function with timeout
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

// ---------- LocalStorage helpers ----------
const loadCachedPic = (userSub: string): string | undefined => {
  try {
    return localStorage.getItem(`profilePic:${userSub}`) || undefined;
  } catch {
    return undefined;
  }
};

const saveCachedPic = (userSub: string, pic?: string) => {
  try {
    if (pic) {
      localStorage.setItem(`profilePic:${userSub}`, pic);
    } else {
      localStorage.removeItem(`profilePic:${userSub}`);
    }
  } catch {
    // ignore quota/storage errors
  }
};

// helper: convert image URL to base64
const fetchImageAsBase64 = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const useUserDetails = (userSub?: string) => {
  const [userDetails, setUserDetails] = useState<UserDetails>();
  const [crinzMessages, setCrinzMessages] = useState<CrinzMessage[]>([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingCrinz, setLoadingCrinz] = useState(false);
  const [lastKey, setLastKey] = useState<string | undefined>();
  const [userError, setUserError] = useState<any>(null);
  const [crinzError, setCrinzError] = useState<any>(null);

  // -------- Fetch user details with deduplication --------
  const fetchUserDetails = useCallback(
    async (forcePic = false) => {
      if (!userSub) return;

      const cacheKey = `user-${userSub}-${forcePic}`;

      // Check if this request is already in progress
      if (activeUserFetches.has(cacheKey)) {
        console.log("[useUserDetails] User fetch already in progress, waiting...");
        try {
          const cachedUser = await activeUserFetches.get(cacheKey);
          if (cachedUser) {
            setUserDetails(cachedUser);
            userCache[userSub] = cachedUser;
          }
          return;
        } catch (error) {
          console.error("Error waiting for existing user fetch:", error);
        }
      }

      // Check cache first, but only if we're not forcing a pic refresh
      if (userCache[userSub] && !forcePic) {
        console.log("[useUserDetails] userCache hit for:", userSub);

        // If cached user has no pic, check localStorage
        if (!userCache[userSub].profilePic) {
          const stored = loadCachedPic(userSub);
          if (stored) {
            // Update cache with stored pic
            userCache[userSub].profilePic = stored;
          } else if (userCache[userSub].profilePicPath) {
            // User has a pic path but no cached image - need to fetch
            forcePic = true;
          } else {
            // User truly has no profile picture
            setUserDetails(userCache[userSub]);
            return;
          }
        } else {
          // Cache has everything we need
          setUserDetails(userCache[userSub]);
          return;
        }
      }

      console.log("[useUserDetails] Fetching user from API:", userSub, "forcePic:", forcePic);
      setLoadingUser(true);
      setUserError(null); // before request

      try {
        // Create a promise for this request and store it
        const userFetchPromise = withTimeout((async () => {
          try {
            const token = localStorage.getItem("access_token");
            if (!token) {
              console.warn("[useUserDetails] No access_token found");
              return;
            }

            const url = new URL(USER_API_URL);
            url.searchParams.append("userId", userSub);

            // Always include fetchPic if we need the image URL
            if (forcePic || !userCache[userSub]?.profilePic) {
              url.searchParams.append("fetchPic", "true");
            }

            const { data } = await axios.get<UserDetails>(url.toString(), {
              headers: { Authorization: `Bearer ${token}` },
            });

            let finalProfilePic = data.profilePic;

            // Convert HTTP URL to base64 if we fetched a new picture
            if (data.profilePic && data.profilePic.startsWith("http")) {
              try {
                finalProfilePic = await fetchImageAsBase64(data.profilePic);
                saveCachedPic(userSub, finalProfilePic);
              } catch (err) {
                console.error("[useUserDetails] Failed to convert profilePic:", err);
                // Keep the HTTP URL as fallback
                finalProfilePic = data.profilePic;
              }
            }

            // If no pic from API, try localStorage
            if (!finalProfilePic) {
              finalProfilePic = loadCachedPic(userSub);
            }

            const merged = {
              ...data,
              profilePic: finalProfilePic,
              profilePicPath: data.profilePicPath // Keep the path for future reference
            };

            setUserDetails(merged);
            userCache[userSub] = merged;
            return merged;

          } catch (err) {
            setUserError(err);
            throw err;
          } finally {
            setLoadingUser(false);
          }
        })(), 15000);

        activeUserFetches.set(cacheKey, userFetchPromise);
        await userFetchPromise;

      } catch (err) {
        console.error("User fetch failed:", err);
      } finally {
        // Always remove from active fetches when done
        activeUserFetches.delete(cacheKey);
      }
    },
    [userSub]
  );

  // -------- Fetch crinz messages with deduplication --------
  const fetchCrinzMessages = useCallback(
    async (startKey?: string) => {
      if (!userSub) return;

      const cacheKey = `crinz-${userSub}-${startKey || 'initial'}`;

      // Check if this request is already in progress
      if (activeCrinzFetches.has(cacheKey)) {
        console.log("[useUserDetails] Crinz fetch already in progress, waiting...");
        try {
          const cachedCrinz = await activeCrinzFetches.get(cacheKey);
          if (cachedCrinz) {
            setCrinzMessages(prev => {
              const merged = startKey ? [...prev, ...cachedCrinz.posts] : cachedCrinz.posts;
              crinzCache[userSub] = merged;
              lastKeyCache[userSub] = cachedCrinz.lastKey || undefined;
              return merged;
            });
            setLastKey(cachedCrinz.lastKey || undefined);
          }
          return;
        } catch (error) {
          console.error("Error waiting for existing crinz fetch:", error);
        }
      }

      if (!startKey && crinzCache[userSub]) {
        console.log("[useUserDetails] crinzCache hit for:", userSub);
        setCrinzMessages(crinzCache[userSub]);
        setLastKey(lastKeyCache[userSub]);
        return;
      }

      console.log("[useUserDetails] Fetching crinz messages from API for:", userSub, "startKey:", startKey);
      setLoadingCrinz(true);
      setCrinzError(null); // before request

      try {
        // Create a promise for this request and store it
        const crinzFetchPromise = withTimeout((async () => {
          try {
            const url = new URL(CRINZ_API_URL);
            const newLocal = "[useUserDetails] ACTUAL API CALL to fetch crinzmessages..";
            console.log(newLocal);
            url.searchParams.append("limit", String(POSTS_PER_PAGE));
            if (startKey) url.searchParams.append("lastKey", startKey);
            url.searchParams.append("userId", userSub);

            const res = await fetch(url.toString(), {
              headers: { Authorization: `Bearer ${localStorage.getItem("id_token")}` },
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: CrinzResponse = await res.json();

            setCrinzMessages(prev => {
              const merged = startKey ? [...prev, ...data.posts] : data.posts;
              crinzCache[userSub] = merged;
              lastKeyCache[userSub] = data.lastKey || undefined;
              return merged;
            });

            setLastKey(data.lastKey || undefined);
            return data;

          } catch (err) {
            setCrinzError(err);  // 👈 set error state
            if (!startKey) setCrinzMessages([]);
            setLastKey(undefined);
            throw err;
          } finally {
            setLoadingCrinz(false);
          }
        })(), 15000);

        activeCrinzFetches.set(cacheKey, crinzFetchPromise);
        await crinzFetchPromise;

      } catch (err) {
        console.error("Crinz fetch failed:", err);
      } finally {
        // Always remove from active fetches when done
        activeCrinzFetches.delete(cacheKey);
      }
    },
    [userSub]
  );

  // -------- Load more posts --------
  const loadMoreCrinz = useCallback(() => {
    if (lastKey && !loadingCrinz) fetchCrinzMessages(lastKey);
  }, [lastKey, fetchCrinzMessages, loadingCrinz]);

  // -------- Initial fetch on mount / userSub change --------
  useEffect(() => {
    if (userSub) {
      fetchUserDetails();
      fetchCrinzMessages();
    }
  }, [userSub, fetchUserDetails, fetchCrinzMessages]);

  // -------- Clean up any stuck promises on unmount --------
  useEffect(() => {
    return () => {
      // Clean up any active fetches when components unmount
      activeUserFetches.clear();
      activeCrinzFetches.clear();
    };
  }, []);

  // -------- Add a new crinz message --------
  const addCrinzMessage = useCallback(
    (msg: CrinzMessage) => {
      setCrinzMessages(prev => {
        const updated = [msg, ...prev];
        if (userSub) crinzCache[userSub] = updated;
        console.log("[useUserDetails] Added new crinz message:", msg.crinzId);
        return updated;
      });
    },
    [userSub]
  );

  // -------- Update user details --------
  // Simplified updateUserDetails function
const updateUserDetails = useCallback(
  (details: UserDetails, refreshPic = false) => {
    setUserDetails(details);
    if (userSub) {
      userCache[userSub] = details;
      console.log("[useUserDetails] User details updated:", details.userId);

      if (refreshPic) {
        // Bust both cache + localStorage and refetch
        delete userCache[userSub];
        saveCachedPic(userSub, undefined);
        fetchUserDetails(true);
      }
    }
  },
  [userSub, fetchUserDetails]
);

  return {
    userDetails,
    crinzMessages,
    loadingUser,
    loadingCrinz,
    lastKey,
    fetchUserDetails,
    fetchCrinzMessages,
    loadMoreCrinz,
    addCrinzMessage,
    updateUserDetails,
    userError,
    crinzError,
  };
};