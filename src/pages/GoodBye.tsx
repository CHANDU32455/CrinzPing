import React, { useEffect } from "react";
import SignUpButton from "../components/auth/signupButton";
import { useNavigate } from "react-router-dom";

const GoodBye: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();

    const timer = setTimeout(() => {
      navigate("/");
    }, 8000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        textAlign: "center",
        backgroundColor: "#121212",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        color: "#e2e8f0"
      }}
    >
      <div
        style={{
          background: "#1e1e1e",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.6)",
          maxWidth: "500px",
          width: "100%"
        }}
      >
        <div
          style={{
            fontSize: "48px",
            marginBottom: "20px"
          }}
        >
          👋
        </div>

        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            color: "#f7fafc",
            margin: "0 0 16px 0"
          }}
        >
          Goodbye!
        </h1>

        <p
          style={{
            fontSize: "1.1rem",
            color: "#a0aec0",
            lineHeight: "1.6",
            margin: "0 0 30px 0"
          }}
        >
          Your account has been successfully deleted. We're sad to see you go,
          but we respect your decision. All your data has been permanently removed.
        </p>

        <div
          style={{
            fontSize: "0.9rem",
            color: "#cbd5e0",
            margin: "20px 0"
          }}
        >
          Redirecting to homepage in a few seconds...
        </div>

        <div
          style={{
            marginTop: "30px",
            paddingTop: "20px",
            borderTop: "1px solid #2d3748"
          }}
        >
          <p
            style={{
              fontSize: "0.9rem",
              color: "#a0aec0",
              margin: "0 0 15px 0"
            }}
          >
            Changed your mind?
          </p>

          <SignUpButton />
        </div>
      </div>

      <p
        style={{
          marginTop: "30px",
          fontSize: "0.8rem",
          color: "#718096"
        }}
      >
        © 2024 CrinzPing. Thank you for being part of our community.
      </p>
    </div>
  );
};

export default GoodBye;



