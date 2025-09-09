import React, { useState, type FormEvent, type KeyboardEvent } from 'react';
import { ContributeSeo } from '../components/Seo';
import Select from "react-select";
import { useCrinzLogic } from "../hooks/useCrinzLogic";
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import type { CrinzMessage } from '../hooks/UserInfo';
import "../css/crinzsubmit.css";

interface CognitoIdTokenPayload {
    sub: string;
    email: string;
    'cognito:username': string;
    [key: string]: any;
}

interface TagOption {
    label: string;
    value: string;
}

// Extend the CrinzMessage interface to include tags
interface ExtendedCrinzMessage extends CrinzMessage {
    tags?: string[];
    userName?: string;
}

const CrinzSubmit: React.FC = () => {
    const { auth } = useCrinzLogic();
    const navigate = useNavigate();
    const [status, setStatus] = useState<"idle" | "roasting" | "success" | "error">("idle");
    const [userName, setUserName] = useState('');
    const [message, setMessage] = useState('');
    const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);
    const [customTagInput, setCustomTagInput] = useState('');
    const [useCustom, setUseCustom] = useState(false);
    const [response, setResponse] = useState('');

    const addCrinzMessage = (newCrinz: ExtendedCrinzMessage) => {
        const cacheKey = `crinz_posts_${auth.user?.profile.sub}`;
        const existingRaw = sessionStorage.getItem(cacheKey);
        let existingPosts: ExtendedCrinzMessage[] = [];

        if (existingRaw) {
            try {
                existingPosts = JSON.parse(existingRaw);
            } catch (e) {
                console.error("Error parsing cached posts:", e);
                existingPosts = [];
            }
        }

        // add new crinz, dedupe by crinzId, sort by latest
        const mergedPosts = [newCrinz, ...existingPosts];
        const uniquePosts = Array.from(
            new Map(mergedPosts.map(p => [p.crinzId, p])).values()
        );

        uniquePosts.sort((a, b) => {
            const t1 = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const t2 = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return t2 - t1;
        });

        sessionStorage.setItem(cacheKey, JSON.stringify(uniquePosts));
    };

    if (!auth.isAuthenticated) {
        return (
            <div className="crinz-signin-prompt">
                <ContributeSeo />
                <h2 className="crinz-signin-title">Please sign in to submit your roast 🔒</h2>
                <button
                    onClick={() => auth.signinRedirect()}
                    className="crinz-signin-button"
                >
                    Sign In
                </button>
            </div>
        );
    }

    const defaultTags = [
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

    const tagOptions: TagOption[] = defaultTags.map(tag => ({
        label: tag,
        value: tag
    }));

    const validateFields = () => {
        if (!userName.trim()) {
            setResponse("⚠️ Please enter your name.");
            return false;
        }
        if (!message.trim()) {
            setResponse("⚠️ Please enter a roast message.");
            return false;
        }
        if (selectedTags.length === 0) {
            setResponse("⚠️ Please add at least one tag.");
            return false;
        }
        if (message.length > 500) {
            setResponse("⚠️ Message too long. Maximum 500 characters.");
            return false;
        }
        return true;
    };

    const handleCustomTagInput = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addCustomTag();
        }
    };

    const addCustomTag = () => {
        const trimmedInput = customTagInput.trim();
        if (trimmedInput && !selectedTags.some(tag => tag.value === trimmedInput)) {
            const newTag = { label: trimmedInput, value: trimmedInput };
            setSelectedTags([...selectedTags, newTag]);
            setCustomTagInput('');
        }
    };

    const removeTag = (tagToRemove: TagOption) => {
        setSelectedTags(selectedTags.filter(tag => tag.value !== tagToRemove.value));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validateFields()) return;

        setStatus("roasting");
        setResponse("");

        const idToken = auth.user?.id_token;
        if (!idToken) {
            setResponse("Auth error: No ID token found.");
            setStatus("error");
            return;
        }

        try {
            const decoded = jwtDecode<CognitoIdTokenPayload>(idToken);
            const userId = decoded['cognito:username'] ?? decoded.sub;
            const tags = selectedTags.map(tag => tag.value);

            const payload = { userId, userName, message, tags };

            const res = await fetch(import.meta.env.VITE_POST_CRINZ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.status === 201) {
                // Add the new crinz to local state immediately
                const newCrinz: ExtendedCrinzMessage = {
                    crinzId: data.crinzId,
                    message: message,
                    tags: tags,
                    likeCount: 0,
                    commentCount: 0,
                    timestamp: new Date().toISOString(),
                    userName: userName
                };

                addCrinzMessage(newCrinz);

                setStatus("success");
                setResponse("✅ Roast submitted successfully! Redirecting...");

                // Clear form
                setUserName('');
                setMessage('');
                setSelectedTags([]);
                setCustomTagInput('');

                // Redirect to profile after a short delay
                setTimeout(() => {
                    navigate('/extras');
                }, 2000);

            } else {
                setResponse(data.error || `Error: ${res.status} ${res.statusText}`);
                setStatus("error");
            }
        } catch (err: any) {
            setResponse(`❌ Network error: ${err.message}`);
            setStatus("error");
        }
    };

    return (
        <div className="crinz-submit-container">
            <ContributeSeo />
            <h2 className="crinz-submit-title">🔥 Submit Your Roast</h2>
            
            <form onSubmit={handleSubmit} className="crinz-form">
                <div className="form-group">
                    <input
                        className="crinz-input"
                        type="text"
                        placeholder="Your Name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        disabled={status === "roasting"}
                    />
                </div>

                <div className="form-group">
                    <textarea
                        className="crinz-textarea"
                        placeholder="Roast message (max 500 characters)"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        maxLength={500}
                        disabled={status === "roasting"}
                    />
                    <div className="char-count">{message.length}/500</div>
                </div>

                <div className="form-group">
                    <div className="tag-switch">
                        <span className="switch-label">
                            {useCustom ? "Add Custom Tags" : "Select from Popular Tags"}
                        </span>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={useCustom}
                                onChange={() => setUseCustom(!useCustom)}
                                disabled={status === "roasting"}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>

                    {useCustom ? (
                        <div className="custom-tags-container">
                            <div className="tag-chips">
                                {selectedTags.map(tag => (
                                    <span key={tag.value} className="tag-chip">
                                        {tag.label}
                                        <button 
                                            type="button" 
                                            className="tag-remove"
                                            onClick={() => removeTag(tag)}
                                            disabled={status === "roasting"}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder="Type tag and press Enter or comma"
                                className="tag-input"
                                value={customTagInput}
                                onChange={(e) => setCustomTagInput(e.target.value)}
                                onKeyDown={handleCustomTagInput}
                                disabled={status === "roasting"}
                            />
                        </div>
                    ) : (
                        <div className="tag-select">
                            <Select
                                options={tagOptions}
                                value={selectedTags}
                                onChange={(selected) => setSelectedTags(selected as TagOption[])}
                                isMulti
                                isSearchable
                                placeholder="Select tags..."
                                classNamePrefix="react-select"
                                isDisabled={status === "roasting"}
                            />
                        </div>
                    )}
                </div>

                <button
                    className={`submit-btn ${status === "roasting" ? "loading" : ""}`}
                    type="submit"
                    disabled={status === "roasting"}
                >
                    {status === "roasting" ? "Roasting..." : "Roast 'em!"}
                </button>
                
                {response && (
                    <div className={`response-message ${status === "error" ? "error" : "success"}`}>
                        {response}
                    </div>
                )}
            </form>
        </div>
    );
};

export default CrinzSubmit;