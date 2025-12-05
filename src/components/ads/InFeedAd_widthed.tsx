import { useEffect } from "react";

export default function InFeedAd() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("In-feed AdSense error:", e);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{
        display: "block",
        margin: "16px 0",
        width: "100%",
      }}
      data-ad-format="fluid"
      data-ad-layout-key="-fb+5w+4e-db+86"
      data-ad-client="ca-pub-9109025008323118"
      data-ad-slot="3531230673"
    ></ins>
  );
}
