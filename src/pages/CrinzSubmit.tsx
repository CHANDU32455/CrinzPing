import React, { useState, type FormEvent, type KeyboardEvent } from 'react';
import { ContributeSeo } from '../components/shared/Seo';
import Select from "react-select";
import { useCrinzLogic } from "../hooks/useCrinzLogic";
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import type { CrinzMessage } from '../hooks/UserInfo';
import "../styles/crinz-submit.css";

interface CognitoIdTokenPayload {
    sub: string;
    'cognito:username': string;
    [key: string]: any;
}

interface TagOption {
    label: string;
    value: string;
}

interface ExtendedCrinzMessage extends CrinzMessage {
    tags?: string[];
}

const defaultTags = [
    "General", "LoveFails", "FirstDateDisasters", "OfficeGossip", "CollegeDrama",
    "FamilyPressure", "SocialMediaGoneWrong", "TravelMishaps", "EmbarrassingMoments",
    "FriendshipFails", "FestivalFiascos", "MarriageMadness", "NeighbourhoodStories",
    "SchoolCringe", "AwkwardEncounters"
];

const tagOptions: TagOption[] = defaultTags.map(tag => ({ label: tag, value: tag }));

const CrinzSubmit: React.FC = () => {
    const { auth } = useCrinzLogic();
    const navigate = useNavigate();

    const [status, setStatus] = useState<"idle" | "roasting" | "success" | "error">("idle");
    const [message, setMessage] = useState('');
    const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);
    const [customTagInput, setCustomTagInput] = useState('');
    const [useCustom, setUseCustom] = useState(false);
    const [response, setResponse] = useState('');

    const addCrinzMessage = (newCrinz: ExtendedCrinzMessage) => {
        const cacheKey = `crinz_posts_${auth.user?.profile.sub}`;
        const existingPosts: ExtendedCrinzMessage[] = JSON.parse(sessionStorage.getItem(cacheKey) || '[]');

        const mergedPosts = [newCrinz, ...existingPosts];
        const uniquePosts = Array.from(new Map(mergedPosts.map(p => [p.crinzId, p])).values());
        uniquePosts.sort((a, b) => (new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()));

        sessionStorage.setItem(cacheKey, JSON.stringify(uniquePosts));
    };

    if (!auth.isAuthenticated) {
        return (
            <div className="crinz-signin-prompt">
                <ContributeSeo />
                <h2 className="crinz-signin-title">Please sign in to submit your roast 🔒</h2>
                <button onClick={() => auth.signinRedirect()} className="crinz-signin-button">Sign In</button>
            </div>
        );
    }

    const validateFields = () => {
        if (!message.trim()) { setResponse("⚠️ Please enter a roast message."); return false; }
        if (selectedTags.length === 0) { setResponse("⚠️ Please add at least one tag."); return false; }
        if (message.length > 500) { setResponse("⚠️ Message too long. Maximum 500 characters."); return false; }
        return true;
    };

    const handleCustomTagInput = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addCustomTag(); }
    };

    const addCustomTag = () => {
        const trimmedInput = customTagInput.trim();
        if (trimmedInput && !selectedTags.some(tag => tag.value === trimmedInput)) {
            setSelectedTags([...selectedTags, { label: trimmedInput, value: trimmedInput }]);
            setCustomTagInput('');
        }
    };

    const removeTag = (tagToRemove: TagOption) => setSelectedTags(selectedTags.filter(tag => tag.value !== tagToRemove.value));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateFields()) return;

        setStatus("roasting");
        setResponse("");

        const idToken = auth.user?.id_token;
        if (!idToken) { setResponse("Auth error: No ID token found."); setStatus("error"); return; }

        try {
            const decoded = jwtDecode<CognitoIdTokenPayload>(idToken);
            const userId = decoded['cognito:username'] ?? decoded.sub;
            const tags = selectedTags.map(tag => tag.value);

            const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/postCrinz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ userId, message, tags }) // Removed userName
            });

            const data = await res.json();

            if (res.status === 201) {
                addCrinzMessage({
                    crinzId: data.crinzId,
                    message,
                    tags,
                    likeCount: 0,
                    commentCount: 0,
                    timestamp: new Date().toISOString(),
                });
                setStatus("success");
                setResponse("✅ Roast submitted successfully! Redirecting...");
                setMessage(''); setSelectedTags([]); setCustomTagInput('');
                setTimeout(() => navigate('/profile'), 2000);
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
                        <span className="switch-label">{useCustom ? "Add Custom Tags" : "Select from Popular Tags"}</span>
                        <label className="switch">
                            <input type="checkbox" checked={useCustom} onChange={() => setUseCustom(!useCustom)} disabled={status === "roasting"} />
                            <span className="slider"></span>
                        </label>
                    </div>

                    {useCustom ? (
                        <div className="custom-tags-container">
                            <div className="tag-chips">
                                {selectedTags.map(tag => (
                                    <span key={tag.value} className="tag-chip">
                                        {tag.label}
                                        <button type="button" className="tag-remove" onClick={() => removeTag(tag)} disabled={status === "roasting"}>×</button>
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

                <button className={`submit-btn ${status === "roasting" ? "loading" : ""}`} type="submit" disabled={status === "roasting"}>
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