import { useContext } from "react";
import { AdsContext } from "../../context/AdsContext";

export const useAds = () => useContext(AdsContext);