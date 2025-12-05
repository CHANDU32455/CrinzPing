import { createContext } from "react";

export interface AdsContextType {
  adsEnabled: boolean;
  setAdsEnabled: (value: boolean) => void;
}

export const AdsContext = createContext<AdsContextType>({
  adsEnabled: false,
  setAdsEnabled: () => { },
});