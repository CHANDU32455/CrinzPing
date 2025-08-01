export default function AboutApp() {
    return (
        <div className="about-app" style={styles.wrapper}>
            <h1 style={styles.heading}>About CrinzPing 🔥</h1>
            <p style={styles.desc}>
                CrinzPing isn’t your regular productivity or social app. 
                It’s a platform designed to keep life fun and savage — in the best way possible.
                Our mission is simple: send you <strong>3 perfectly timed personalized crinzes</strong> (roasts) every day,
                straight to your feed, just when you need that extra laugh.
            </p>

            <h2 style={styles.subHeading}>What makes CrinzPing unique?</h2>
            <ul style={styles.list}>
                <li>⚡ Personalized roasts that match your vibe</li>
                <li>📅 Delivered 3 times daily — no mercy, only fun</li>
                <li>🤝 Community-driven crinz contributions</li>
                <li>🌐 Fully serverless on AWS — fast, secure, and scalable</li>
            </ul>

            <h2 style={styles.subHeading}>The Future of CrinzPing 🚀</h2>
            <p style={styles.desc}>
                We’re just getting started. Here's what’s coming soon:
            </p>
            <ul style={styles.list}>
                <li>🔥 User-level crinz submissions & likes</li>
                <li>💬 Live feed of the best community roasts</li>
                <li>🎯 Smart roast personalization powered by AI</li>
                <li>🏆 Leaderboards for the top crinzers</li>
                <li>📱 Push notifications so you never miss your daily roast</li>
            </ul>

            <p style={styles.footer}>
                CrinzPing is for the bold, the brave, and anyone who knows how to laugh at themselves.
                Buckle up — it’s about to get funnier.
            </p>
        </div>
    )
}

const styles = {
    wrapper: {
        fontFamily: "'Fira Code', monospace",
        backgroundColor: "#000",
        color: "limegreen",
        minHeight: "100vh",
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
        lineHeight: 1.6,
    },
    heading: {
        fontSize: "2rem",
        marginBottom: "1rem",
        textShadow: "0 0 8px limegreen",
    },
    subHeading: {
        fontSize: "1.4rem",
        marginTop: "2rem",
        marginBottom: "0.8rem",
        color: "#00ffcc",
    },
    desc: {
        fontSize: "1rem",
        marginBottom: "1rem",
    },
    list: {
        listStyle: "none",
        paddingLeft: 0,
        marginBottom: "1rem",
    },
    footer: {
        marginTop: "2rem",
        fontSize: "0.95rem",
        color: "#aaa",
        fontStyle: "italic",
    }
}
