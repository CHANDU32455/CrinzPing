import { useState } from "react";
import { AdsContext } from "./AdsContext";

export const AdsProvider = ({ children }: { children: React.ReactNode }) => {
    const [adsEnabled, setAdsEnabled] = useState(true);

    return (
        <AdsContext.Provider value={{ adsEnabled, setAdsEnabled }}>
            {children}
        </AdsContext.Provider>
    );
};