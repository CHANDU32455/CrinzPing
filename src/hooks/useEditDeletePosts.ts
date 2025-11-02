// hooks/usePostActions.ts
import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "react-oidc-context";

const PROFILE_BATCH_API_URL = `${import.meta.env.VITE_BASE_API_URL}/handleEditDeleteUserPosts`;
const POST_BATCH_API_URL = `${import.meta.env.VITE_BASE_API_URL}/batchProcesser`;
const STORAGE_KEY = "profile:pendingActions";

interface PendingAction {
  type: "update" | "delete" | "like" | "unlike" | "add_comment" | "remove_comment";
  postId: string;
  crinzId?: string;
  commentId?: string;
  payload?: string;
  timestamp?: string;
  data?: {
    message?: string;
    tags?: string[];
  };
}

interface UsePostActionsReturn {
  addPendingAction: (action: PendingAction) => void;
  executePendingActions: () => Promise<void>;
  hasPendingActions: boolean;
  clearPendingActions: () => void;
  pendingActionsCount: number;
  getPendingActions: () => PendingAction[];
}

export const usePostActions = (): UsePostActionsReturn & {
  clearPendingActionFor: (match: { type: string; postId: string; commentId?: string; payload?: string }) => boolean;
} => {
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const isExecuting = useRef(false);
  const auth = useAuth();
  const userId = auth?.user?.profile?.sub;

  // Load from storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPendingActions(parsed);
        console.log("[usePostActions] Loaded pending actions:", parsed);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        console.warn("[usePostActions] Failed to parse stored actions, cleared storage");
      }
    }
  }, []);

  // Persist to storage
  useEffect(() => {
    if (pendingActions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingActions));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [pendingActions]);

  const addPendingAction = useCallback((action: PendingAction) => {
    setPendingActions(prev => {
      // For like/unlike actions, handle conflicts
      if (action.type === "like" || action.type === "unlike") {
        const filtered = prev.filter(a =>
          !(a.type === "like" || a.type === "unlike") || a.postId !== action.postId
        );

        // Check if this action cancels out a previous one
        const oppositeActionIndex = prev.findIndex(a =>
          a.postId === action.postId &&
          ((a.type === "like" && action.type === "unlike") ||
            (a.type === "unlike" && action.type === "like"))
        );

        if (oppositeActionIndex !== -1) {
          const updatedActions = [...prev];
          updatedActions.splice(oppositeActionIndex, 1);
          return updatedActions;
        }

        return [...filtered, { ...action, timestamp: Date.now().toString() }];
      }

      // For comment actions, handle add/delete conflicts
      if (action.type === "add_comment" || action.type === "remove_comment") {
        if (action.type === "remove_comment" && action.commentId?.startsWith("temp-")) {
          const addActionIndex = prev.findIndex(a =>
            a.type === "add_comment" &&
            a.postId === action.postId &&
            a.payload === action.payload
          );

          if (addActionIndex !== -1) {
            const updatedActions = [...prev];
            updatedActions.splice(addActionIndex, 1);
            return updatedActions;
          }
        }
        return [...prev, { ...action, timestamp: Date.now().toString() }];
      }

      // For update/delete
      return [...prev, { ...action, timestamp: Date.now().toString() }];
    });
  }, []);

  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
  }, []);

  const clearPendingActionFor = useCallback(
    (match: { type: string; postId: string; commentId?: string; payload?: string }) => {
      let removed = false;
      setPendingActions(prev => {
        const filtered = prev.filter(a => {
          const typeMatches = a.type === match.type;
          const postIdMatches = a.postId === match.postId;
          const commentIdMatches = !match.commentId || a.commentId === match.commentId;
          const payloadMatches = !match.payload || a.payload === match.payload;

          if (typeMatches && postIdMatches && commentIdMatches && payloadMatches) {
            removed = true;
            return false;
          }
          return true;
        });
        return filtered;
      });
      return removed;
    },
    []
  );

  const executePendingActions = useCallback(async () => {
    if (pendingActions.length === 0 || isExecuting.current) return;
    isExecuting.current = true;
    const actionsToProcess = [...pendingActions];

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      if (actionsToProcess.length > 25) {
        throw new Error("Too many actions; DynamoDB transactWrite limit is 25");
      }

      // map actions to backend payload
      const backendActions = actionsToProcess.map(action => {
        const { data, ...rest } = action;
        if (action.type === "update" && data) {
          return { ...rest, data };
        }
        if ((action.type === "like" || action.type === "unlike") && !action.crinzId) {
          return { ...rest, crinzId: action.postId };
        }
        if ((action.type === "add_comment" || action.type === "remove_comment") && !action.crinzId) {
          return { ...rest, crinzId: action.postId };
        }
        return rest;
      });

      // split actions into two groups
      const postActions = backendActions.filter(a =>
        ["like", "unlike", "add_comment", "remove_comment"].includes(a.type)
      );
      const profileActions = backendActions.filter(a =>
        ["update", "delete"].includes(a.type)
      );

      // helper to send actions to correct endpoint
      const sendActions = async (url: string, actions: any[]) => {
        if (actions.length === 0) return;

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            actions,
            userId,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || err.error || `Batch API failed`);
        }
      };

      // execute in sequence
      if (profileActions.length > 0) {
        await sendActions(PROFILE_BATCH_API_URL, profileActions);
      }
      if (postActions.length > 0) {
        await sendActions(POST_BATCH_API_URL, postActions);
      }

      setPendingActions([]); // clear if both succeed
    } catch (err) {
      console.error("[usePostActions] Error executing batch:", err);
      throw err;
    } finally {
      isExecuting.current = false;
    }
  }, [pendingActions, userId]);

  const getPendingActions = useCallback(() => [...pendingActions], [pendingActions]);

  return {
    addPendingAction,
    executePendingActions,
    hasPendingActions: pendingActions.length > 0,
    clearPendingActions,
    pendingActionsCount: pendingActions.length,
    getPendingActions,
    clearPendingActionFor,
  };
};
