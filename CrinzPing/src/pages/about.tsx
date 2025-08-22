import { AboutSeo } from "../components/Seo"

export default function AboutApp() {
    return (
        <div className="about-app" style={styles.wrapper}>
            <AboutSeo />
            <h1 style={styles.heading}>About CrinzPing 🔥</h1>
            <p style={styles.desc}>
                CrinzPing isn’t your regular social app. 
                It’s a savage feed that keeps life fun, bold, and brutally honest. 
                Our mission is simple: drop <strong>the funniest, most ruthless crinzes</strong> straight into your feed — 
                powered by the community and tuned for laughs.
            </p>

            <h2 style={styles.subHeading}>What’s Live Right Now ⚡</h2>
            <ul style={styles.list}>
                <li>📡 <strong>Real-time feed</strong> with instant crinz updates</li>
                <li>👍 <strong>Likes & comments</strong> so every roast gets its moment</li>
                <li>💾 <strong>Smart caching</strong> for lightning-fast scrolling</li>
                <li>📶 <strong>Local-first actions</strong> — like, comment, laugh even offline</li>
                <li>🛡️ <strong>Robust error handling</strong> so nothing breaks the fun</li>
            </ul>

            <h2 style={styles.subHeading}>What Makes CrinzPing Unique?</h2>
            <ul style={styles.list}>
                <li>⚡ Savage content tailored for bold personalities</li>
                <li>🤝 100% community-driven crinz contributions</li>
                <li>📱 Mobile-first design — feels like an app, runs everywhere</li>
            </ul>

            <h2 style={styles.subHeading}>What’s Next 🚀</h2>
            <p style={styles.desc}>
                We’re already working on the next evolution of CrinzPing:
            </p>
            <ul style={styles.list}>
                <li>🔥 Personalized crinz recommendations powered by AI</li>
                <li>🏆 Leaderboards for the top crinzers</li>
                <li>💬 Global roast rooms & community threads</li>
                <li>📱 Push notifications for daily laughs</li>
                <li>🪄 User profile customizations & achievements</li>
            </ul>

            <p style={styles.footer}>
                CrinzPing is for the fearless. If you can laugh at yourself, 
                you’ll never run out of reasons to stay. Buckle up — the roast culture just went live. 🔥
            </p>
        </div>
    )
}

const styles = {
  wrapper: {
    fontFamily: "'Fira Code', monospace",
    backgroundColor: "#0a0a0a",
    color: "#d0f0c0",
    minHeight: "100vh",
    padding: "3rem 2rem",
    maxWidth: "900px",
    margin: "0 auto",
    lineHeight: 1.7,
  },
  heading: {
    fontSize: "2.5rem",
    marginBottom: "1.5rem",
    fontWeight: 700,
    textShadow: "0 0 12px #00ff99",
    letterSpacing: "1px",
  },
  subHeading: {
    fontSize: "1.6rem",
    marginTop: "2.5rem",
    marginBottom: "1rem",
    color: "#00ffcc",
    fontWeight: 600,
    borderBottom: "2px solid #00ffcc",
    paddingBottom: "0.3rem",
  },
  desc: {
    fontSize: "1.05rem",
    marginBottom: "1.5rem",
    lineHeight: 1.8,
  },
  list: {
    listStyle: "none",
    paddingLeft: "0",
    marginBottom: "2rem",
  },
  listItem: {
    display: "flex",
    alignItems: "flex-start",
    fontSize: "1rem",
    marginBottom: "0.8rem",
    lineHeight: 1.6,
  },
  emoji: {
    display: "inline-block",
    width: "1.5rem",
    marginRight: "0.6rem",
    fontSize: "1.2rem",
  },
  footer: {
    marginTop: "3rem",
    fontSize: "1rem",
    color: "#aaa",
    fontStyle: "italic",
    borderTop: "1px solid #444",
    paddingTop: "1.5rem",
  },
};
