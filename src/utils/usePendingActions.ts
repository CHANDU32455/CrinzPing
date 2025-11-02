import { useState, useEffect } from "react";

export interface PendingAction {
  type: "like" | "unlike" | "add_comment" | "remove_comment";
  crinzId: string;
  payload?: string;  // Can be comment text or commentId
  commentId?: string; // add this to track comment uniquely
  timestamp: number;
}


const ACTIONS_CACHE_KEY = "crinz_pending_actions";

export const usePendingActions = () => {
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(ACTIONS_CACHE_KEY);
    const actions: PendingAction[] = cached ? JSON.parse(cached) : [];
    setPendingActions(actions);
    setHydrated(true);
    // console.log("🔄 Hydrated pending actions:", actions);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(ACTIONS_CACHE_KEY, JSON.stringify(pendingActions));
  }, [pendingActions, hydrated]);

  const addAction = (action: PendingAction) => {
    setPendingActions(prev => {
      // for add_comment, prevent adding duplicate comment for same crinzId & payload
      if (action.type === "add_comment") {
        const exists = prev.some(
          a =>
            a.type === "add_comment" &&
            a.crinzId === action.crinzId &&
            a.payload === action.payload
        );
        if (exists) {
          // console.log("Duplicate add_comment prevented:", action.payload);
          return prev; // don't add duplicate
        }
      }
      return [...prev, action];
    });
  };


  const removeAction = (predicate: (a: PendingAction) => boolean) =>
    setPendingActions(prev => prev.filter(a => !predicate(a)));
  const replaceActions = (actions: PendingAction[]) => setPendingActions(actions);
  const clearActions = () => {
    setPendingActions([]);
    localStorage.removeItem(ACTIONS_CACHE_KEY);
  };

  const createAction = (
    type: PendingAction["type"],
    crinzId: string,
    payload?: string,
    commentId?: string
  ): PendingAction => ({
    type,
    crinzId,
    payload,
    commentId,
    timestamp: Date.now(),
  });


  return { pendingActions, hydrated, addAction, removeAction, replaceActions, clearActions, createAction };
};
