import { useState, useCallback, useEffect } from "react";

export interface PendingAction {
  type: "like" | "unlike" | "add_comment" | "remove_comment";
  crinzId: string;
  timestamp: number;
  payload?: {
    commentId?: string;
    comment?: string;
  };
}

const STORAGE_KEY = "crinz_pending_actions_v5";
const DEBUG = true;

function saveToStorage(actions: PendingAction[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
    if (DEBUG) {
      console.log("[PendingActions] Saved to storage:", actions.length, "actions");
    }
  } catch (error) {
    console.error("[PendingActions] Failed to save to storage:", error);
  }
}

function loadFromStorage(): PendingAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const actions = raw ? JSON.parse(raw) : [];
    if (DEBUG) {
      console.log("[PendingActions] Loaded from storage:", actions.length, "actions");
    }
    return actions;
  } catch (error) {
    console.error("[PendingActions] Failed to load from storage:", error);
    return [];
  }
}

export const usePendingActions = () => {
  const [pendingActions, setPendingActions] = useState<PendingAction[]>(() =>
    loadFromStorage()
  );

  const neutralize = (actions: PendingAction[]): PendingAction[] => {
    if (DEBUG) {
      console.log("[PendingActions] Neutralizing", actions.length, "actions");
    }

    const likeMap = new Map<string, PendingAction>();
    const commentMap = new Map<string, PendingAction>();

    for (const action of actions) {
      if (action.type === "like" || action.type === "unlike") {
        const key = `${action.crinzId}-${action.type}`;
        const existing = likeMap.get(key);
        
        // Like followed by unlike cancels out
        if (existing && existing.type !== action.type) {
          if (DEBUG) {
            console.log(`[PendingActions] Neutralizing like/unlike for post ${action.crinzId}`);
          }
          likeMap.delete(key);
        } else {
          likeMap.set(key, action);
        }
      } 
      else if (action.type === "add_comment" || action.type === "remove_comment") {
        let key: string;
        
        if (action.type === "add_comment") {
          // For add_comment, use crinzId + comment text as key
          key = `comment_${action.crinzId}_${action.payload?.comment}`;
        } else {
          // For remove_comment, use crinzId + commentId as key
          key = `comment_${action.crinzId}_${action.payload?.commentId}`;
        }
        
        const existing = commentMap.get(key);
        
        // Add followed by remove cancels out
        if (existing && existing.type !== action.type) {
          if (DEBUG) {
            console.log(`[PendingActions] Neutralizing comment action for post ${action.crinzId}`);
          }
          commentMap.delete(key);
        } else {
          commentMap.set(key, action);
        }
      }
    }

    const result = [
      ...Array.from(likeMap.values()),
      ...Array.from(commentMap.values())
    ].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    if (DEBUG) {
      console.log("[PendingActions] Neutralized to", result.length, "actions");
    }

    return result;
  };

  const addPendingAction = useCallback((action: PendingAction) => {
    if (DEBUG) {
      console.log("[PendingActions] Adding action:", action);
    }
    
    setPendingActions(prev => {
      const merged = [...prev, action];
      const neutralized = neutralize(merged);
      saveToStorage(neutralized);
      return neutralized;
    });
  }, []);

  const removePendingActions = useCallback((actionsToRemove: PendingAction[]) => {
    if (DEBUG) {
      console.log("[PendingActions] Removing", actionsToRemove.length, "actions");
    }
    
    setPendingActions(prev => {
      const updated = prev.filter(action => 
        !actionsToRemove.some(removeAction => 
          removeAction.type === action.type &&
          removeAction.crinzId === action.crinzId &&
          removeAction.timestamp === action.timestamp &&
          JSON.stringify(removeAction.payload) === JSON.stringify(action.payload)
        )
      );
      saveToStorage(updated);
      
      if (DEBUG) {
        console.log("[PendingActions] Remaining after removal:", updated.length, "actions");
      }
      
      return updated;
    });
  }, []);

  const clearAllPendingActions = useCallback(() => {
    if (DEBUG) {
      console.log("[PendingActions] Clearing all actions");
    }
    
    setPendingActions([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const triggerImmediateSync = useCallback(() => {
    if (DEBUG) {
      console.log("[PendingActions] Triggering immediate sync");
    }
    window.dispatchEvent(new CustomEvent('forceImmediateSync'));
  }, []);

  useEffect(() => {
    if (DEBUG) {
      console.log("[PendingActions] Current pending actions:", pendingActions.length);
    }
    saveToStorage(pendingActions);
  }, [pendingActions]);

  return {
    pendingActions,
    addPendingAction,
    removePendingActions,
    clearAllPendingActions,
    triggerImmediateSync
  };
};

export default usePendingActions;