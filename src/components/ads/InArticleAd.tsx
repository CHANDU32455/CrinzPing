import { useEffect } from "react";

interface AdSenseConfig {
  'data-ad-layout': string;
  'data-ad-format': string;
  'data-ad-client': string;
  'data-ad-slot': string;
}

export default function InArticleAd() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error("In-article AdSense error:", e.message);
      } else {
        console.error("In-article AdSense error:", e);
      }
    }
  }, []);

  const adConfig: AdSenseConfig = {
    'data-ad-layout': 'in-article',
    'data-ad-format': 'fluid',
    'data-ad-client': 'ca-pub-9109025008323118',
    'data-ad-slot': '2203613234'
  };

  return (
    <ins
      className="adsbygoogle"
      style={{
        display: "block",
        textAlign: "center",
        margin: "20px 0",
      }}
      {...adConfig}
    ></ins>
  );
}