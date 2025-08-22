const InvalidPage = () => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>404 — Page Not Found</h2>
        <p style={styles.text}>Oops! The page you are looking for does not exist.</p>
        <a href="/" style={styles.link}>Go back home</a>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#0a0a0a",
    padding: "1rem",
  },
  card: {
    textAlign: "center",
    background: "#111",
    padding: "2rem 3rem",
    borderRadius: "12px",
    boxShadow: "0 0 20px rgba(0,255,204,0.3)",
    border: "1px solid #00ffcc",
  },
  heading: {
    fontSize: "1.8rem",
    color: "#00ffcc",
    marginBottom: "1rem",
  },
  text: {
    fontSize: "1rem",
    color: "#aaa",
    marginBottom: "1rem",
  },
  link: {
    color: "#00ffcc",
    textDecoration: "underline",
    fontWeight: "bold",
  },
};

export default InvalidPage;
