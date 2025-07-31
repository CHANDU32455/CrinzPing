import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

type UserDetails = {
  userId: string;
  email: string;
  displayName: string;
  timeZone: string;
  preferences: { categories?: string[] };
};

const UserProfileTile = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error" | "unauth">("idle");

  // 🧩 Step 1: Extract Cognito userId
  useEffect(() => {
    try {
      const token = localStorage.getItem("id_token");
      if (!token) throw new Error("No JWT");

      const decoded: any = jwtDecode(token);
      const uid = decoded["cognito:username"] ?? decoded.sub;
      if (!uid) throw new Error("No userId");

      console.log("✅ Cognito userId detected:", uid);
      setUserId(uid);

      const cached = sessionStorage.getItem("userDetails");
      if (cached) {
        setUserDetails(JSON.parse(cached));
        setStatus("ready");
      }
    } catch {
      setStatus("unauth");
    }
  }, []);

  // 🔄 Step 2: Fetch user details
  const fetchDetails = async () => {
    if (!userId) return;
    setStatus("loading");

    try {
      const token = localStorage.getItem("id_token");

      const res = await fetch(import.meta.env.VITE_GET_USER_DETAILS_API_URL, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      const fullDetails = { userId, ...data };

      sessionStorage.setItem("userDetails", JSON.stringify(fullDetails));
      setUserDetails(fullDetails);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", color: "lime" }}>
      {status === "unauth" && <p>⚠️ No JWT or userId found. Are you logged in?</p>}
      {userId && <p>🆔 Cognito userId: <strong>{userId}</strong></p>}

      {status === "loading" && <p>🔄 Fetching user profile...</p>}
      {status === "error" && <p>❌ Failed to load profile data.</p>}

      {!userDetails && userId && status !== "loading" && (
        <button
          onClick={fetchDetails}
          style={{
            padding: "0.5rem 1rem",
            background: "black",
            color: "lime",
            border: "1px solid lime",
            cursor: "pointer"
          }}
        >
          🔍 Fetch Profile Details
        </button>
      )}

      {userDetails && (
        <div style={{ marginTop: "2rem" }}>
          <h3>{userDetails.displayName}</h3>
          <p>Email: {userDetails.email}</p>
          <p>TimeZone: {userDetails.timeZone}</p>
          <p>
            Categories: {userDetails.preferences?.categories?.join(", ") || "None"}
          </p>
        </div>
      )}
    </div>
  );
};

export default UserProfileTile;
