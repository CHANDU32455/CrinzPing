import { useEffect } from "react";
import { APP_CONFIG } from "../config/appConfig";

const AdsScriptLoader = () => {
  const adsEnabled = APP_CONFIG.ads;

  useEffect(() => {
    if (!adsEnabled) return;

    const script = document.createElement("script");
    script.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9109025008323118";
    script.async = true;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [adsEnabled]);

  return null;
};

export default AdsScriptLoader;
