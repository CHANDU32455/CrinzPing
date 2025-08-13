import React, { useState, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import { useLocation } from "react-router-dom";
import Select from "react-select";

const UserDetailsForm = () => {
    const location = useLocation();
    const routeState = location.state as { userDetails?: any } | null;
    const userDetails = routeState?.userDetails;

    const [displayName, setDisplayName] = useState(userDetails?.displayName || "");
    const [timeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [categories, setCategories] = useState<string[]>(userDetails?.categories || []);
    const [baselineDetails, setBaselineDetails] = useState({
        displayName: userDetails?.displayName || "",
        categories: userDetails?.categories || [],
    });

    const [selectedCategory, setSelectedCategory] = useState<{ label: string; value: string } | null>(null);
    const [newCategory, setNewCategory] = useState("");
    const [useDropdown, setUseDropdown] = useState(true);
    const [status, setStatus] = useState<"idle" | "posting" | "success" | "error">("idle");

    const token = localStorage.getItem("access_token");
    if (!token) {
        console.warn("Missing access token for getUserDetails");
        return <div>Access token missing</div>;
    }

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

    const isFormValid = displayName.trim() !== "" && categories.length > 0;

    const hasChanges = useMemo(() => {
        return (
            displayName.trim() !== baselineDetails.displayName.trim() ||
            JSON.stringify([...categories].sort()) !== JSON.stringify([...baselineDetails.categories].sort())
        );
    }, [displayName, categories, baselineDetails]);

    const handleAddCategory = () => {
        if (useDropdown && selectedCategory) {
            if (!categories.includes(selectedCategory.value)) {
                setCategories([...categories, selectedCategory.value]);
            }
            setSelectedCategory(null);
        } else if (!useDropdown) {
            const trimmed = newCategory.trim();
            if (trimmed && !categories.includes(trimmed)) {
                setCategories([...categories, trimmed]);
                setNewCategory("");
            }
        }
    };

    const handleRemoveCategory = (cat: string) => {
        setCategories(categories.filter((c) => c !== cat));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid || !hasChanges) return;

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
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to post");
            setStatus("success");

            // Update baseline to match the newly saved data
            setBaselineDetails({ displayName, categories: [...categories] });
        } catch (err) {
            console.error(err);
            setStatus("error");
        }
    };

    const defaultCategories = [
        "General",
        "LoveFails",
        "FirstDateDisasters",
        "OfficeGossip",
        "CollegeDrama",
        "FamilyPressure",
        "SocialMediaGoneWrong",
        "TravelMishaps",
        "EmbarrassingMoments",
        "FriendshipFails",
        "FestivalFiascos",
        "MarriageMadness",
        "NeighbourhoodStories",
        "SchoolCringe",
        "AwkwardEncounters"
    ];

    const categoryOptions = defaultCategories.map(cat => ({ label: cat, value: cat }));

    const pageStyles = {
        wrapper: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            backgroundColor: "#000",
            padding: "1rem",
        },
    };

    const styles = {
        container: {
            fontFamily: "monospace",
            backgroundColor: "#0a0a0a",
            color: "limegreen",
            padding: "2rem",
            borderRadius: "10px",
            boxShadow: "0 0 12px limegreen",
            width: "100%",
            maxWidth: "520px",
            display: "flex",
            flexDirection: "column" as const,
        },
        label: {
            marginTop: "1.5rem",
            marginBottom: "0.5rem",
            fontSize: "1rem",
            fontWeight: "bold",
        },
        note: {
            fontSize: "0.8rem",
            color: "#aaa",
            marginBottom: "0.5rem",
        },
        switchWrapper: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.8rem",
            padding: "0.3rem 0",
        },
        switchLabel: {
            fontSize: "0.9rem",
            color: "#aaa",
        },
        switch: {
            position: "relative" as const,
            width: "70px",
            height: "28px",
            background: useDropdown ? "limegreen" : "#555",
            borderRadius: "28px",
            cursor: "pointer",
            transition: "background 0.3s",
            display: "flex",
            alignItems: "center",
            padding: "0 5px",
        },
        switchCircle: {
            position: "absolute" as const,
            top: "3px",
            left: useDropdown ? "40px" : "4px",
            width: "22px",
            height: "22px",
            background: "#fff",
            borderRadius: "50%",
            transition: "left 0.3s",
        },
        switchText: {
            fontSize: "0.7rem",
            color: "#000",
            fontWeight: "bold",
            width: "100%",
            textAlign: "center" as const,
            zIndex: 1,
        },
        inputRow: {
            display: "flex",
            gap: "0.5rem",
            marginTop: "0.5rem",
        },
        input: {
            flex: 1,
            padding: "0.5rem",
            border: "1px solid limegreen",
            backgroundColor: "#111",
            color: "lime",
            fontSize: "1rem",
            borderRadius: "4px",
        },
        addButton: {
            padding: "0.5rem 1rem",
            backgroundColor: "limegreen",
            color: "#000",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
        },
        chipsContainer: {
            display: "flex",
            flexWrap: "wrap" as const,
            gap: "0.5rem",
            marginTop: "0.8rem",
        },
        chip: {
            display: "flex",
            alignItems: "center",
            backgroundColor: "#1a1a1a",
            color: "limegreen",
            padding: "0.35rem 0.7rem",
            borderRadius: "16px",
            fontSize: "0.85rem",
            border: "1px solid limegreen",
            transition: "all 0.2s ease",
        },
        chipClose: {
            marginLeft: "0.5rem",
            color: "#888",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "color 0.2s ease",
        },
        button: {
            marginTop: "2rem",
            padding: "0.75rem 1.5rem",
            backgroundColor: isFormValid && hasChanges ? "limegreen" : "#333",
            color: isFormValid && hasChanges ? "#0a0a0a" : "#777",
            fontWeight: "bold",
            border: "none",
            borderRadius: "6px",
            cursor: isFormValid && hasChanges ? "pointer" : "not-allowed",
            boxShadow: isFormValid && hasChanges ? "0 0 5px lime" : "none",
            transition: "all 0.2s ease",
        },
        status: {
            marginTop: "1rem",
            fontStyle: "italic",
            textAlign: "center" as const,
            color: status === "error" ? "red" : "yellowgreen",
        },
    };

    return (
        <div style={pageStyles.wrapper}>
            <form onSubmit={handleSubmit} style={styles.container}>
                <label style={styles.label}>Display Name:</label>
                <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={styles.input}
                    placeholder="NeoNinja87"
                />

                <label style={styles.label}>Preferred Categories</label>
                <div style={styles.note}>This helps us personalize your experience.</div>

                {/* Switch */}
                <div style={styles.switchWrapper}>
                    <span style={styles.switchLabel}>
                        {useDropdown ? "Dropdown Mode" : "Manual Mode"}
                    </span>
                    <div style={styles.switch} onClick={() => setUseDropdown(prev => !prev)}>
                        <span style={styles.switchText}>{useDropdown ? "Drop" : "Input"}</span>
                        <div style={styles.switchCircle}></div>
                    </div>
                </div>

                {/* Dropdown or Input */}
                <div style={styles.inputRow}>
                    {useDropdown ? (
                        <Select
                            options={categoryOptions}
                            value={selectedCategory}
                            onChange={(selected) => setSelectedCategory(selected)}
                            isClearable
                            placeholder="Select a category"
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    background: "#2a2a3d",
                                    borderColor: "#444",
                                    color: "#fff",
                                    minHeight: "40px",
                                    boxShadow: "none",
                                    "&:hover": { borderColor: "limegreen" },
                                }),
                                singleValue: (base) => ({ ...base, color: "#fff" }),
                                menu: (base) => ({
                                    ...base,
                                    background: "#1e1e2f",
                                    color: "#fff",
                                    border: "1px solid #444",
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isFocused ? "#333" : "#1e1e2f",
                                    color: "#fff",
                                    cursor: "pointer",
                                }),
                                placeholder: (base) => ({ ...base, color: "#aaa" }),
                                input: (base) => ({ ...base, color: "#fff" }),
                            }}
                        />
                    ) : (
                        <input
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            style={styles.input}
                            placeholder="Enter custom category"
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCategory())}
                        />
                    )}
                    <button type="button" onClick={handleAddCategory} style={styles.addButton}>
                        Add
                    </button>
                </div>

                {/* Chips */}
                <div style={styles.chipsContainer}>
                    {categories.map((cat) => (
                        <div key={cat} style={styles.chip}>
                            {cat}
                            <span
                                style={styles.chipClose}
                                onMouseOver={(e) => (e.currentTarget.style.color = "red")}
                                onMouseOut={(e) => (e.currentTarget.style.color = "#888")}
                                onClick={() => handleRemoveCategory(cat)}
                            >
                                ✕
                            </span>
                        </div>
                    ))}
                </div>

                <button
                    type="submit"
                    style={{
                        ...styles.button,
                        ...((!isFormValid || !hasChanges || status === "posting") && {
                            backgroundColor: "#333",
                            color: "#777",
                            cursor: "not-allowed",
                            boxShadow: "none",
                        }),
                    }}
                    disabled={!isFormValid || !hasChanges || status === "posting"}
                >
                    {status === "posting" ? "Saving..." : "🌀 Save Details"}
                </button>

                <div style={styles.status}>
                    {status !== "idle" && `Status: ${status}`}
                </div>
            </form>
        </div>
    );
};

export default UserDetailsForm;
