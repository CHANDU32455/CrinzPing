import { useEffect } from "react";

// Extend window object for AdSense
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function InArticleAd() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("In-article AdSense error:", e);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{
        display: "block",
        textAlign: "center",
        margin: "20px 0",
      }}
      data-ad-layout="in-article"
      data-ad-format="fluid"
      data-ad-client="ca-pub-9109025008323118"
      data-ad-slot="2203613234"
    ></ins>
  );
}
