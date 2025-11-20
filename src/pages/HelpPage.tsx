import React from "react";

const HelpPage: React.FC = () => {
  // Inline CSS styles
  const containerStyle: React.CSSProperties = {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    color: "#f5f5f5",
    lineHeight: 1.6,
    backgroundColor: "#121212",
    minHeight: "100vh",
    boxSizing: "border-box"
  };

  const headerStyle: React.CSSProperties = {
    textAlign: "center",
    marginBottom: "40px",
    padding: "30px 20px",
    background: "linear-gradient(135deg, #2a2a3d 0%, #1e1e2f 100%)",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
    border: "1px solid #3a3a52"
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "clamp(28px, 5vw, 32px)",
    marginBottom: "10px",
    color: "#3a86ff",
    fontWeight: 700,
    textShadow: "0 2px 4px rgba(58, 134, 255, 0.3)"
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "clamp(16px, 3vw, 18px)",
    color: "#a0a0c0",
    margin: 0,
    lineHeight: 1.5
  };

  const sectionStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #2a2a3d 0%, #1e1e2f 100%)",
    borderRadius: "12px",
    padding: "25px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    border: "1px solid #3a3a52"
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "clamp(20px, 4vw, 22px)",
    marginBottom: "20px",
    color: "#3a86ff",
    fontWeight: 600,
    paddingBottom: "10px",
    borderBottom: "2px solid #3a3a52",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  };

  const faqItemStyle: React.CSSProperties = {
    marginBottom: "20px",
    padding: "20px",
    backgroundColor: "rgba(58, 134, 255, 0.08)",
    borderRadius: "10px",
    borderLeft: "4px solid #3a86ff",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer"
  };

  const faqQuestionStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "12px",
    color: "#f5f5f5",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  };

  const faqAnswerStyle: React.CSSProperties = {
    color: "#d0d0e0",
    margin: 0,
    fontSize: "16px",
    lineHeight: 1.6
  };

  const tipStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "20px",
    padding: "20px",
    backgroundColor: "rgba(255, 193, 7, 0.08)",
    borderRadius: "10px",
    borderLeft: "4px solid #ffc107",
    transition: "transform 0.2s ease"
  };

  const tipIconStyle: React.CSSProperties = {
    fontSize: "24px",
    marginRight: "15px",
    flexShrink: 0,
    padding: "8px",
    backgroundColor: "rgba(255, 193, 7, 0.15)",
    borderRadius: "8px",
    minWidth: "40px",
    textAlign: "center"
  };

  const tipContentStyle: React.CSSProperties = {
    flex: 1
  };

  const tipTitleStyle: React.CSSProperties = {
    fontSize: "17px",
    fontWeight: 600,
    marginBottom: "8px",
    color: "#f5f5f5"
  };

  const tipTextStyle: React.CSSProperties = {
    color: "#d0d0e0",
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.6
  };

  const emailStyle: React.CSSProperties = {
    color: "#3a86ff",
    textDecoration: "none",
    fontWeight: 600,
    transition: "color 0.2s ease"
  };

  const contactStyle: React.CSSProperties = {
    marginTop: "20px"
  };

  const contactMethodsStyle: React.CSSProperties = {
    display: "flex",
    gap: "15px",
    marginTop: "20px",
    flexWrap: "wrap"
  };

  const contactButtonStyle: React.CSSProperties = {
    padding: "14px 24px",
    backgroundColor: "#3a3a52",
    border: "none",
    borderRadius: "10px",
    color: "white",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 500,
    transition: "all 0.2s ease",
    fontSize: "16px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
  };

  const footerStyle: React.CSSProperties = {
    textAlign: "center",
    marginTop: "50px",
    padding: "25px 20px",
    color: "#a0a0c0",
    fontSize: "15px",
    borderTop: "1px solid #2a2a3d",
    background: "rgba(26, 26, 39, 0.5)",
    borderRadius: "12px"
  };

  const contentLayoutStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "30px"
  };

  // Hover effect functions
  const handleFaqHover = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.3)";
    e.currentTarget.style.backgroundColor = "rgba(58, 134, 255, 0.12)";
  };

  const handleFaqLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "none";
    e.currentTarget.style.backgroundColor = "rgba(58, 134, 255, 0.08)";
  };

  const handleTipHover = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.backgroundColor = "rgba(255, 193, 7, 0.12)";
  };

  const handleTipLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.backgroundColor = "rgba(255, 193, 7, 0.08)";
  };

  const handleButtonHover = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = "#4a4a62";
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
  };

  const handleButtonLeave = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = "#3a3a52";
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
  };

  const handleEmailHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = "#5fa3ff";
    e.currentTarget.style.textDecoration = "underline";
  };

  const handleEmailLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = "#3a86ff";
    e.currentTarget.style.textDecoration = "none";
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>📖 Help Center</h2>
        <p style={subtitleStyle}>
          Get the most out of CrinzPing with our comprehensive guide and troubleshooting resources
        </p>
      </div>

      <div style={contentLayoutStyle}>
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>❓ Frequently Asked Questions</h3>
          <div>
            <div 
              style={faqItemStyle}
              onMouseEnter={handleFaqHover}
              onMouseLeave={handleFaqLeave}
            >
              <h4 style={faqQuestionStyle}>🔹 How do I start using CrinzPing?</h4>
              <p style={faqAnswerStyle}>
                Simply sign in, set up your profile, and you'll start receiving your daily crinz messages automatically.
                You can also explore the app to discover features and customize your experience.
              </p>
            </div>
            
            <div 
              style={faqItemStyle}
              onMouseEnter={handleFaqHover}
              onMouseLeave={handleFaqLeave}
            >
              <h4 style={faqQuestionStyle}>🔹 How to add a crinz?</h4>
              <p style={faqAnswerStyle}>
                Navigate to the Extras section, go to your profile tab, and click on the + symbol. 
                Fill out the submission form with your creative crinz content and tags.
              </p>
            </div>
            
            <div 
              style={faqItemStyle}
              onMouseEnter={handleFaqHover}
              onMouseLeave={handleFaqLeave}
            >
              <h4 style={faqQuestionStyle}>🔹 How to delete a crinz?</h4>
              <p style={faqAnswerStyle}>
                Visit your profile, select the crinz you want to remove, click on the three-dot menu, 
                and choose the delete option. This action is permanent.
              </p>
            </div>
            
            <div 
              style={faqItemStyle}
              onMouseEnter={handleFaqHover}
              onMouseLeave={handleFaqLeave}
            >
              <h4 style={faqQuestionStyle}>🔹 How to share a crinz?</h4>
              <p style={faqAnswerStyle}>
                Click the share icon below any crinz to generate a unique URL that you can 
                send to friends or post on social media platforms.
              </p>
            </div>
            
            <div 
              style={faqItemStyle}
              onMouseEnter={handleFaqHover}
              onMouseLeave={handleFaqLeave}
            >
              <h4 style={faqQuestionStyle}>🔹 How to update my profile?</h4>
              <p style={faqAnswerStyle}>
                Access the Edit Profile option in your profile settings to modify your information, 
                preferences, and privacy settings.
              </p>
            </div>
            
            <div 
              style={faqItemStyle}
              onMouseEnter={handleFaqHover}
              onMouseLeave={handleFaqLeave}
            >
              <h4 style={faqQuestionStyle}>🔹 How to fetch a new crinz?</h4>
              <p style={faqAnswerStyle}>
                Use the refresh button located at the top right of the crinz display to instantly 
                load a new crinz message.
              </p>
            </div>
            
            <div 
              style={faqItemStyle}
              onMouseEnter={handleFaqHover}
              onMouseLeave={handleFaqLeave}
            >
              <h4 style={faqQuestionStyle}>🔹 Account management</h4>
              <p style={faqAnswerStyle}>
                Sign out through your profile settings, or delete your account entirely via the 
                Settings tab. Account deletion is permanent and irreversible.
              </p>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>⚙️ Troubleshooting Guide</h3>
          <div>
            <div 
              style={tipStyle}
              onMouseEnter={handleTipHover}
              onMouseLeave={handleTipLeave}
            >
              <span style={tipIconStyle}>🔍</span>
              <div style={tipContentStyle}>
                <h4 style={tipTitleStyle}>Not receiving crinz messages?</h4>
                <p style={tipTextStyle}>
                  Verify your internet connection, check notification settings, and ensure 
                  your app is updated to the latest version. Also confirm that you're signed in.
                </p>
              </div>
            </div>
            
            <div 
              style={tipStyle}
              onMouseEnter={handleTipHover}
              onMouseLeave={handleTipLeave}
            >
              <span style={tipIconStyle}>🔄</span>
              <div style={tipContentStyle}>
                <h4 style={tipTitleStyle}>App performance issues?</h4>
                <p style={tipTextStyle}>
                  Try refreshing the page, clearing your browser cache, or restarting the app. 
                  For persistent problems, try logging out and back in to refresh your session.
                </p>
              </div>
            </div>
            
            <div 
              style={tipStyle}
              onMouseEnter={handleTipHover}
              onMouseLeave={handleTipLeave}
            >
              <span style={tipIconStyle}>📧</span>
              <div style={tipContentStyle}>
                <h4 style={tipTitleStyle}>Need additional assistance?</h4>
                <p style={tipTextStyle}>
                  Contact our support team at{" "}
                  <a 
                    href="mailto:crinzping@gmail.com" 
                    style={emailStyle}
                    onMouseEnter={handleEmailHover}
                    onMouseLeave={handleEmailLeave}
                  >
                    crinzping@gmail.com
                  </a>{" "}
                  for personalized help with any issues you're experiencing.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>📞 Contact Support</h3>
          <div style={contactStyle}>
            <p style={tipTextStyle}>
              Our dedicated support team is available to assist you with any questions, 
              technical issues, or feedback you might have. We're committed to providing 
              timely and helpful responses to ensure the best experience with CrinzPing.
            </p>
            <div style={contactMethodsStyle}>
              <a 
                href="mailto:crinzping@gmail.com" 
                style={contactButtonStyle}
                onMouseEnter={handleButtonHover}
                onMouseLeave={handleButtonLeave}
              >
                📧 Email Support
              </a>
            </div>
          </div>
        </section>

        <div style={footerStyle}>
          <p>
            We're continuously working to enhance CrinzPing based on user feedback. 
            Your suggestions help us create a better experience for the entire community!
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;