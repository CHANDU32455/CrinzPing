import React, { useState, type FormEvent } from 'react';
import { useCrinzLogic } from "../hooks/useCrinzLogic";
import { jwtDecode } from 'jwt-decode';

interface CognitoIdTokenPayload {
    sub: string;
    email: string;
    'cognito:username': string;
    [key: string]: any;
}

const CrinzSubmit: React.FC = () => {
    const [userName, setUserName] = useState('');
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState('General');
    const [response, setResponse] = useState('');
    const { auth } = useCrinzLogic();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const idToken = auth.user?.id_token;
        if (!idToken) {
            setResponse("Auth error: No ID token found.");
            return;
        }

        const decoded = jwtDecode<CognitoIdTokenPayload>(idToken);
        const userId = decoded['cognito:username'] ?? decoded.sub;

        const payload = {
            userId,
            userName,
            message,
            category
        };

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
            setResponse(res.status === 201 ? `Roast added! ID: ${data.crinzId}` : data.error);
            setUserName('');
            setMessage('');
            setCategory('General');
        } catch (err: any) {
            setResponse(`Error: ${err.message}`);
        }
    };

    return (
        <div className="crinz-submit">
            <h2>🔥 Submit Your Roast</h2>
            <form className="crinz-form" onSubmit={handleSubmit}>
                <input
                    className="crinz-field"
                    type="text"
                    placeholder="Your Name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                />
                <textarea
                    className="crinz-field crinz-textarea"
                    placeholder="Roast message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <select
                    className="crinz-field"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="General">General</option>
                    <option value="Infra">Infra</option>
                    <option value="Backend">Backend</option>
                    <option value="Frontend">Frontend</option>
                    <option value="DevOps">DevOps</option>
                </select>
                <button className="crinz-button" type="submit">Roast 'em!</button>
                {response && <p className="crinz-response">{response}</p>}
            </form>
        </div>
    );
};

export default CrinzSubmit;
