import { useEffect, useRef } from "react";

// Extend window interface for Google AdSense
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}
// Ad Component
export default function AdUnit() {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if AdSense script is already loaded
    const loadAd = () => {
      try {
        if (window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } else {
          // If script isn't loaded, load it dynamically
          const script = document.createElement('script');
          script.async = true;
          script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9109025008323118';
          script.crossOrigin = 'anonymous';
          script.onload = () => {
            // Wait a bit for the script to initialize
            setTimeout(() => {
              if (window.adsbygoogle) {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
              }
            }, 100);
          };
          document.head.appendChild(script);
        }
      } catch (e) {
        console.error("AdSense error:", e);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(loadAd, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="reel-ad-container" ref={adContainerRef}>
      <div className="ad-label">Advertisement</div>
      {/* CrinzPing_ADS */}
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          margin: "12px 0",
        }}
        data-ad-client="ca-pub-9109025008323118"
        data-ad-slot="5969691753"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}