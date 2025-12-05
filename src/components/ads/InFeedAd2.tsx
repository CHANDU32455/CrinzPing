import { useEffect } from "react";

export default function InFeedAd2() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("In-feed Ad 2 error:", e);
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
      data-ad-layout-key="-6t+ed+2i-1n-4w"
      data-ad-client="ca-pub-9109025008323118"
      data-ad-slot="8385878207"
    ></ins>
  );
}
