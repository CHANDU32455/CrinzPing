import { useEffect, useRef } from "react";
import { usePendingActions } from "../utils/usePendingActions";
import syncBatchActions from "../hooks/useBatchSync";

export function usePendingSync(
  pendingActions: any[],
  userAccessToken: string
) {
  const actionsRef = useRef(pendingActions);
  const tokenRef = useRef(userAccessToken);

  // keep refs updated
  useEffect(() => {
    actionsRef.current = pendingActions;
    tokenRef.current = userAccessToken;
  }, [pendingActions, userAccessToken]);

  const sendPendingActions = async () => {
    const actions = actionsRef.current;
    const token = tokenRef.current;

    if (!token || actions.length === 0) return;

    try {
      // directly call syncBatchActions instead of sendBeacon
      const { remaining, processed } = await syncBatchActions(actions);
      actionsRef.current = remaining;
      if (processed.length > 0) console.log("Pending actions synced:", processed);
    } catch (err) {
      console.error("⚠️ Failed to sync pending actions:", err);
    }
  };

  // ✅ Trigger on tab close / page refresh and SPA navigation
  useEffect(() => {
    const pushState = history.pushState;
    const replaceState = history.replaceState;

    history.pushState = function (...args) {
      sendPendingActions();
      // @ts-ignore
      return pushState.apply(this, args);
    };
    history.replaceState = function (...args) {
      sendPendingActions();
      // @ts-ignore
      return replaceState.apply(this, args);
    };

    window.addEventListener("beforeunload", sendPendingActions);

    return () => {
      window.removeEventListener("beforeunload", sendPendingActions);
      history.pushState = pushState;
      history.replaceState = replaceState;
    };
  }, []);

  // ✅ Return manual trigger for unmount / route change
  return sendPendingActions;
};

export const usePendingSyncOnUnload = () => {
  const { pendingActions, replaceActions, hydrated } = usePendingActions();

  useEffect(() => {
    if (!hydrated) return;

    const handleUnload = async () => {
      if (!pendingActions.length) return;
      try {
        const { remaining, processed } = await syncBatchActions(pendingActions);
        replaceActions(remaining);
        if (processed.length > 0) console.log(" Pending actions synced on unload:", processed);
      } catch (err) {
        console.error("⚠️ Failed to sync pending actions on unload:", err);
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [pendingActions, replaceActions, hydrated]);
};
