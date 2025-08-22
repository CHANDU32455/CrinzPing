import React, { useState, type FormEvent } from 'react';
import { ContributeSeo } from '../components/Seo';
import Select from "react-select";
import { useCrinzLogic } from "../hooks/useCrinzLogic";
import { jwtDecode } from 'jwt-decode';

interface CognitoIdTokenPayload {
    sub: string;
    email: string;
    'cognito:username': string;
    [key: string]: any;
}

const CrinzSubmit: React.FC = () => {
    const { auth } = useCrinzLogic();
    const [userName, setUserName] = useState('');
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState('General');
    const [customCategory, setCustomCategory] = useState('');
    const [useCustom, setUseCustom] = useState(false);
    const [response, setResponse] = useState('');

    if (!auth.isAuthenticated) {
        return (
            <div style={{ maxWidth: '470px', margin: '7rem auto', textAlign: 'center' }}>
                <ContributeSeo />
                <h2>Please sign in to submit your roast 🔒</h2>
                <button
                    onClick={() => auth.signinRedirect()}
                    style={{
                        marginTop: '20px',
                        padding: '12px 24px',
                        background: '#3a86ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    Sign In
                </button>
            </div>
        );
    }

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

    const categoryOptions = defaultCategories.map(cat => ({
        label: cat,
        value: cat
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
        if (useCustom && !customCategory.trim()) {
            setResponse("⚠️ Please enter a custom category.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validateFields()) return;

        const idToken = auth.user?.id_token;
        if (!idToken) {
            setResponse("Auth error: No ID token found.");
            return;
        }

        const decoded = jwtDecode<CognitoIdTokenPayload>(idToken);
        const userId = decoded['cognito:username'] ?? decoded.sub;
        const chosenCategory = useCustom ? customCategory : category;

        const payload = { userId, userName, message, category: chosenCategory };

        try {
            const res = await fetch(import.meta.env.VITE_POST_CRINZ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            setResponse(res.status === 201 ? `✅ Roast added! ID: ${data.crinzId}` : data.error);
            if (res.status === 201) {
                setUserName('');
                setMessage('');
                setCategory('General');
                setCustomCategory('');
                setUseCustom(false);
            }
        } catch (err: any) {
            setResponse(`❌ Error: ${err.message}`);
        }
    };

    // ---------- COOL CSS (Inline) ----------
    const containerStyle = {
        maxWidth: '470px',
        margin: '7rem auto',
        padding: '25px',
        borderRadius: '12px',
        background: '#1e1e2f',
        color: '#f5f5f5',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        fontFamily: 'Arial, sans-serif'
    };

    const titleStyle = {
        textAlign: 'center' as const,
        marginBottom: '20px',
        fontSize: '20px'
    };

    const inputStyle = {
        width: '95%',
        padding: '10px',
        marginBottom: '12px',
        border: '1px solid #444',
        borderRadius: '6px',
        background: '#2a2a3d',
        color: '#fff',
        fontSize: '14px'
    };

    const buttonStyle = {
        width: '100%',
        padding: '12px',
        background: '#3a86ff',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold' as const,
        marginTop: '10px'
    };

    const switchWrapper = {
        display: 'flex',
        alignItems: 'center',
        margin: '10px 0',
        justifyContent: 'space-between'
    };

    const switchLabel = {
        fontSize: '14px'
    };

    const switchContainer = {
        position: 'relative' as const,
        width: '46px',
        height: '24px',
        background: useCustom ? '#3a86ff' : '#555',
        borderRadius: '24px',
        cursor: 'pointer',
        transition: 'background 0.3s'
    };

    const switchCircle = {
        position: 'absolute' as const,
        top: '3px',
        left: useCustom ? '24px' : '3px',
        width: '18px',
        height: '18px',
        background: '#fff',
        borderRadius: '50%',
        transition: 'left 0.3s'
    };

    const responseStyle = {
        marginTop: '12px',
        fontSize: '14px',
        textAlign: 'center' as const
    };

    return (
        <div style={containerStyle}>
            <ContributeSeo />
            <h2 style={titleStyle}>🔥 Submit Your Roast</h2>
            <form onSubmit={handleSubmit}>
                <input
                    style={inputStyle}
                    type="text"
                    placeholder="Your Name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                />

                <textarea
                    style={{ ...inputStyle, height: '90px' }}
                    placeholder="Roast message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />

                <div style={switchWrapper}>
                    <span style={switchLabel}>
                        {useCustom ? "Custom Category" : "Choose from list"}
                    </span>
                    <div
                        style={switchContainer}
                        onClick={() => setUseCustom(prev => !prev)}
                    >
                        <div style={switchCircle}></div>
                    </div>
                </div>

                {useCustom ? (
                    <input
                        type="text"
                        placeholder="Enter custom category"
                        style={inputStyle}
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                    />
                ) : (
                    <Select
                        options={categoryOptions}
                        value={{ label: category, value: category }}
                        onChange={(selected) => setCategory(selected?.value || "General")}
                        isSearchable
                        styles={{
                            control: (base) => ({
                                ...base,
                                background: '#2a2a3d',
                                borderColor: '#444',
                                color: '#fff'
                            }),
                            singleValue: (base) => ({
                                ...base,
                                color: '#fff'
                            }),
                            menu: (base) => ({
                                ...base,
                                background: '#2a2a3d',
                                color: '#fff'
                            })
                        }}
                    />
                )}

                <button style={buttonStyle} type="submit">Roast 'em!</button>
                {response && <p style={responseStyle}>{response}</p>}
            </form>
        </div>
    );
};

export default CrinzSubmit;
