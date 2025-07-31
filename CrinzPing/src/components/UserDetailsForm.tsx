import React, { useState } from "react";
import { jwtDecode } from "jwt-decode";

const UserDetailsForm = () => {
    const [displayName, setDisplayName] = useState("");
    const [timeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [categories, setCategories] = useState<string[]>([]);
    const [status, setStatus] = useState<"idle" | "posting" | "success" | "error">("idle");

    const getUserDetailsFromToken = () => {
        const token = localStorage.getItem("id_token");
        if (!token) return { email: null, userId: null };

        try {
            const decoded: any = jwtDecode(token);
            return {
                email: decoded.email || null,
                userId: decoded["cognito:username"] ?? (decoded.sub || null),
            };
        } catch (err) {
            console.error("Token decoding failed:", err);
            return { email: null, userId: null };
        }
    };

    const { email, userId } = getUserDetailsFromToken();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("posting");

        if (!email || !userId) {
            setStatus("error");
            console.error("Missing user details from token");
            return;
        }

        const payload = {
            userId,
            email,
            displayName,
            timeZone,
            preferences: { categories },
        };

        try {
            const res = await fetch(import.meta.env.VITE_POST_USER_DETAILS_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to post");
            setStatus("success");
        } catch (err) {
            console.error(err);
            setStatus("error");
        }
    };

    const styles = {
        container: {
            fontFamily: "monospace",
            backgroundColor: "#0a0a0a",
            color: "limegreen",
            padding: "2rem",
            borderRadius: "8px",
            boxShadow: "0 0 10px limegreen",
            maxWidth: "600px",
            margin: "0 auto",
        },
        label: {
            display: "block",
            marginTop: "1.5rem",
            marginBottom: "0.5rem",
            fontSize: "1rem",
            fontWeight: "bold",
        },
        input: {
            width: "100%",
            padding: "0.5rem",
            border: "1px solid limegreen",
            backgroundColor: "#111",
            color: "lime",
            fontSize: "1rem",
            borderRadius: "4px",
        },
        button: {
            marginTop: "2rem",
            padding: "0.75rem 1.5rem",
            backgroundColor: "limegreen",
            color: "#0a0a0a",
            fontWeight: "bold",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            boxShadow: "0 0 5px lime",
        },
        status: {
            marginTop: "1rem",
            fontStyle: "italic",
            color: "yellowgreen",
        },
    };

    return (
        <form onSubmit={handleSubmit} style={styles.container}>
            <label style={styles.label}>Display Name:</label>
            <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={styles.input}
                placeholder="NeoNinja87"
            />

            <label style={styles.label}>Preferred Categories (comma separated):</label>
            <input
                value={categories.join(",")}
                onChange={(e) => setCategories(e.target.value.split(",").map(cat => cat.trim()))}
                style={styles.input}
                placeholder="Roasts, TerminalTips"
            />

            <button type="submit" style={styles.button}>🌀 Save Details</button>
            <div style={styles.status}>Status: {status}</div>
        </form>
    );
};

export default UserDetailsForm;
