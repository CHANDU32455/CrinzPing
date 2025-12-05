import { AboutSEO } from "../components/shared/seoContent";

export default function About() {
  return (
    <div style={styles.wrapper}>
      <AboutSEO />
      <h1 style={styles.heading}>About CrinzPing</h1>
      <p style={styles.desc}>
        Welcome to the future of social banter.
        CrinzPing isn't just a platform; it's a movement where every message packs a punch.
        If you're here to be polite, you're lost.
      </p>

      <h2 style={styles.subHeading}>What’s Hot Right Now ⚡</h2>
      <ul style={styles.list}>
        <li>👤 <strong>Enhanced profiles</strong> — flex your crinzes, your way</li>
        <li>💬 <strong>Comments & likes</strong> — every roast gets its hype</li>
        <li>✏️ <strong>Edit & delete</strong> your own posts like a boss</li>
        <li>🌍 <strong>Public profiles & posts</strong> — share your crinz legacy anywhere</li>
        <li>🔗 <strong>Sharable links</strong> for profiles & roasts — go viral, instantly</li>
      </ul>

      <h2 style={styles.subHeading}>Why CrinzPing Hits Different</h2>
      <ul style={styles.list}>
        <li>⚡ Unfiltered content with zero fluff</li>
        <li>🤝 Driven by a fearless community of crinzers</li>
        <li>📱 Feels like an app, runs everywhere</li>
      </ul>

      <h2 style={styles.subHeading}>What’s Next 🚀</h2>
      <p style={styles.desc}>
        We’re not stopping — we’re just leveling up:
      </p>
      <ul style={styles.list}>
        <li>🔥 AI-powered crinz recommendations</li>
        <li>🏆 Leaderboards to crown top crinzers</li>
        <li>💬 Roast rooms & global threads</li>
        <li>📱 Push notifications for daily burns</li>
        <li>🪄 Profile customizations, badges & achievements</li>
      </ul>

      <p style={styles.footer}>
        CrinzPing is for the fearless.
        Roast, laugh, repeat.
        Your profile, your posts, your vibe — now public, now viral.
        Buckle up — the culture of savage honesty is only getting started. 🔥
      </p>
    </div >
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
  footer: {
    marginTop: "3rem",
    fontSize: "1rem",
    color: "#aaa",
    fontStyle: "italic",
    borderTop: "1px solid #444",
    paddingTop: "1.5rem",
  },
};
