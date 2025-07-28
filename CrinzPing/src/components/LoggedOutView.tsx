function LoggedOutView({ appDescription }: { appDescription: string }) {
  return (
    <div style={{
      marginTop: "6rem",
      maxWidth: "700px",
      backgroundColor: "#121212",
      border: "1px solid #333",
      borderRadius: "12px",
      padding: "2rem",
      boxShadow: "0 0 20px rgba(0,255,100,0.05)",
      textAlign: "center",
      fontSize: "1rem",
      color: "#00ffcc"
    }}>
      {appDescription}
    </div>
  );
}
export default LoggedOutView;
