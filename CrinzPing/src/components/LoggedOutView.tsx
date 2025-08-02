function LoggedOutView({ appDescription }: { appDescription: string }) {
  return (
    <div style={styles.wrapper}>
      <h1 style={styles.heading}>Welcome to CrinzPing 🔥</h1>
      <p style={styles.desc}>
        {appDescription}
      </p>

      <h2 style={styles.subHeading}>Why you'll love CrinzPing</h2>
      <ul style={styles.list}>
        <li>⚡ Brutal roasts delivered 3 times daily</li>
        <li>🎯 Tailored to developers, crafted with dark humor</li>
        <li>🤝 Community-driven roast contributions</li>
        <li>🌐 Fully serverless on AWS — blazing fast</li>
      </ul>

      <p style={styles.footer}>
        Sign in to start your daily dose of savage humor.  
        CrinzPing is not for the faint-hearted — but it will make you laugh.
      </p>
    </div>
  );
}

const styles = {
  wrapper: {
    fontFamily: "'Fira Code', monospace",
    backgroundColor: "#000",
    color: "limegreen",
    minHeight: "100vh",
    padding: "2rem 1rem",
    maxWidth: "800px",
    margin: "0 auto",
    lineHeight: 1.6,
    textAlign: "center" as const
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
    color: "#00ffcc",
  },
  list: {
    listStyle: "none",
    paddingLeft: 0,
    marginBottom: "1rem",
    fontSize: "1rem",
  },
  footer: {
    marginTop: "2rem",
    fontSize: "0.95rem",
    color: "#aaa",
    fontStyle: "italic",
  }
};

export default LoggedOutView;
