import React from "react";

const PrivacySettingsPage: React.FC = () => {
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
      <h2 style={{ fontSize: "24px", marginBottom: "16px" }}>Privacy Policy</h2>
      <p>
        Your privacy is important to us. This page explains how we collect, use, and protect your data when you use <strong>CrinzPing</strong>:
      </p>
      <ul style={{ paddingLeft: "20px" }}>
        <li>We do not sell or trade your personal information to third parties.</li>
        <li>Basic account details (such as email, username, and profile setup) are stored securely.</li>
        <li>Your contributed Crinz messages may be displayed to other users but without exposing sensitive details.</li>
        <li>We may collect anonymized usage data to improve the app experience.</li>
        <li>You can request deletion of your account and all related data at any time.</li>
        <li>Cookies or local storage may be used to save your preferences and improve usability.</li>
        <li>We take reasonable steps to protect your data but cannot guarantee complete security.</li>
      </ul>
      <p style={{ marginTop: "20px", fontSize: "14px", color: "#555" }}>
        For more details, reach out to our support.  
        <br />Last updated: September 2025
      </p>
    </div>
  );
};

export default PrivacySettingsPage;
