import { createContext, useContext, useState } from "react";

const AdsContext = createContext({
  adsEnabled: false,
  setAdsEnabled: (_v: boolean) => {},
});

export const AdsProvider = ({ children }: { children: React.ReactNode }) => {
  const [adsEnabled, setAdsEnabled] = useState(true); // default true

  return (
    <AdsContext.Provider value={{ adsEnabled, setAdsEnabled }}>
      {children}
    </AdsContext.Provider>
  );
};

export const useAds = () => useContext(AdsContext);
