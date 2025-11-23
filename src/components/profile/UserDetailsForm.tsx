import React, { useState, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import { useLocation, useNavigate } from "react-router-dom";
import { processAvatarFile } from "../../utils/imageProcessor";
import Select from "react-select";
import { useAuth } from "react-oidc-context";
import "../../styles/user-details-form.css";
import { useUserDetails, type UserDetails as UserDetailsType } from "../../hooks/UserInfo";

const updateUserDetailsPoint = `${import.meta.env.VITE_BASE_API_URL}/postUserData`;

const UserDetailsForm = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { updateUserDetails, userDetails: cachedUserDetails } = useUserDetails(user?.profile.sub);

    const routeState = location.state as { userDetails?: any } | null;
    const userDetails = routeState?.userDetails || cachedUserDetails;

    const [displayName, setDisplayName] = useState(userDetails?.displayName || "");
    const [Tagline, setTagline] = useState(userDetails?.Tagline || "");
    const [timeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [categories, setCategories] = useState<string[]>(userDetails?.categories || []);
    const [baselineDetails, setBaselineDetails] = useState({
        displayName: userDetails?.displayName || "",
        Tagline: userDetails?.Tagline || "",
        categories: userDetails?.categories || [],
        profilePic: userDetails?.profilePic || "",
    });

    const [selectedCategory, setSelectedCategory] = useState<{ label: string; value: string } | null>(null);
    const [newCategory, setNewCategory] = useState("");
    const [useDropdown, setUseDropdown] = useState(true);
    const [status, setStatus] = useState<"idle" | "posting" | "success" | "error">("idle");

    const [profilePic, setProfilePic] = useState<string>(userDetails?.profilePic || "");
    const [avatarPreview, setAvatarPreview] = useState<string>(userDetails?.profilePic || "");

    const token = user?.access_token;
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
            Tagline.trim() !== baselineDetails.Tagline.trim() ||
            JSON.stringify([...categories].sort()) !== JSON.stringify([...baselineDetails.categories].sort()) ||
            profilePic !== baselineDetails.profilePic
        );
    }, [displayName, Tagline, categories, profilePic, baselineDetails]);

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

    // In your handleSubmit function
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid || !hasChanges) return;

        setStatus("posting");

        if (!email || !userId || !token) {
            setStatus("error");
            console.error("Missing user details or token");
            return;
        }

        // Check if username changed
        const usernameChanged = baselineDetails.displayName !== displayName;

        const payload: UserDetailsType = {
            userId,
            email,
            displayName,
            Tagline: Tagline.trim(),
            timeZone,
            preferences: { categories },
            profilePic,
            categories,
            profilePicPath: userDetails?.profilePicPath,
            // Frontend-controlled username update flags
            updateUsername: usernameChanged,
            newDisplayName: usernameChanged ? displayName : undefined
        };

        try {
            // First update the cache for immediate UI response
            updateUserDetails?.(payload, false);

            const response = await fetch(updateUserDetailsPoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            setStatus("success");

            // update baseline so "Save" button disables
            setBaselineDetails({
                displayName,
                Tagline: Tagline.trim(),
                categories: [...categories],
                profilePic
            });

            // Wait for 3 seconds on success before navigating
            setTimeout(() => {
                navigate("/extras", { state: { userDetails: payload } });
            }, 3000);

        } catch (err) {
            console.error("Submission failed:", err);
            setStatus("error");
            // Revert cache update if API call failed
            if (userDetails) {
                updateUserDetails?.(userDetails, false);
            }
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

    const DEFAULT_AVATAR = "data:image/svg+xml;base64," + btoa(
        `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>
            <rect width='120' height='120' fill='#ccc'/>
            <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='#666'>
                No Image
            </text>
        </svg>`
    );

    return (
        <div className="user-details-form">
            <form onSubmit={handleSubmit} className="user-details-form__container">
                {/* Avatar Upload */}
                <label className="user-details-form__label">Profile Picture:</label>
                <div className="user-details-form__avatar-container">
                    <img
                        src={avatarPreview || DEFAULT_AVATAR}
                        alt="Preview"
                        className="user-details-form__avatar-preview"
                    />
                    <input
                        type="file"
                        accept="image/*"
                        className="user-details-form__avatar-input"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                                const processed = await processAvatarFile(file);
                                setAvatarPreview(processed);
                                setProfilePic(processed);
                            } catch (err) {
                                console.error("Avatar processing failed:", err);
                            }
                        }}
                    />
                </div>

                <label className="user-details-form__label">Display Name:</label>
                <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="user-details-form__input"
                    placeholder="NeoNinja87"
                />

                <label className="user-details-form__label">Tagline:</label>
                <textarea
                    value={Tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="user-details-form__textarea"
                    placeholder="Tell us something about yourself..."
                    rows={3}
                    maxLength={150}
                />
                <div className="user-details-form__char-count">
                    {Tagline.length}/150 characters
                </div>

                <label className="user-details-form__label">Preferred Categories</label>
                <span className="user-details-form__note">This helps us personalize your experience.</span>

                {/* Switch */}
                <div className="user-details-form__switch-wrapper">
                    <span className="user-details-form__switch-label">
                        {useDropdown ? "Dropdown Mode" : "Manual Mode"}
                    </span>
                    <div
                        className={`user-details-form__switch ${useDropdown ? 'user-details-form__switch--active' : ''}`}
                        onClick={() => setUseDropdown(prev => !prev)}
                    >
                        <span className="user-details-form__switch-text">{useDropdown ? "Drop" : "Input"}</span>
                        <div className={`user-details-form__switch-circle ${useDropdown ? 'user-details-form__switch-circle--active' : ''}`}></div>
                    </div>
                </div>

                {/* Dropdown or Input */}
                <div className="user-details-form__input-row">
                    {useDropdown ? (
                        <Select
                            options={categoryOptions}
                            value={selectedCategory}
                            onChange={(selected) => setSelectedCategory(selected)}
                            isClearable
                            placeholder="Select a category"
                            classNamePrefix="react-select"
                        />
                    ) : (
                        <input
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="user-details-form__input"
                            placeholder="Enter custom category"
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCategory())}
                        />
                    )}
                    <button type="button" onClick={handleAddCategory} className="user-details-form__add-button">
                        Add
                    </button>
                </div>

                {/* Chips */}
                <div className="user-details-form__chips-container">
                    {categories.map((cat) => (
                        <div key={cat} className="user-details-form__chip">
                            {cat}
                            <span
                                className="user-details-form__chip-close"
                                onClick={() => handleRemoveCategory(cat)}
                            >
                                ✕
                            </span>
                        </div>
                    ))}
                </div>

                <button
                    type="submit"
                    className={`user-details-form__button ${isFormValid && hasChanges && status !== "posting" ? 'user-details-form__button--active' : ''}`}
                    disabled={!isFormValid || !hasChanges || status === "posting"}
                >
                    {status === "posting" ? "Saving..." : "🌀 Save Details"}
                </button>

                <div className={`user-details-form__status ${status === "success" ? 'user-details-form__status--success' : ''}`}>
                    {status !== "idle" && `Status: ${status}`}
                </div>
            </form>
        </div>
    );
};

export default UserDetailsForm;