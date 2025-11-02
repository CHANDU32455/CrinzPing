import React from "react";

const TermsPage: React.FC = () => {
  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        lineHeight: "1.6",
        color: "#333",
      }}
    >
      <h2 style={{ fontSize: "24px", marginBottom: "16px" }}>Terms of Service</h2>
      <p>
        By using <strong>CrinzPing</strong>, you agree to the following terms and conditions:
      </p>
      <ol style={{ paddingLeft: "20px" }}>
        <li>Use the app respectfully and responsibly.</li>
        <li>No spamming, abusing, or sharing harmful, hateful, or illegal content.</li>
        <li>Crinz messages are intended for fun. Do not use them to harass or bully others.</li>
        <li>Your account may be suspended or terminated for violations of these terms.</li>
        <li>You are responsible for keeping your login credentials secure.</li>
        <li>Content submitted by you (like crinz messages) may be reused within the app.</li>
        <li>We may update or remove features without prior notice.</li>
        <li>These terms may be updated at any time, and continued use means acceptance.</li>
      </ol>
      <p style={{ marginTop: "20px", fontSize: "14px", color: "#555" }}>
        Last updated: September 2025
      </p>
    </div>
  );
};

export default TermsPage;
