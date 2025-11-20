import { jwtDecode } from "jwt-decode";
import type { PendingAction } from "../utils/usePendingActions";

interface ProcessedItem {
  type: string;
  crinzId: string;
  payload?: string;
  status?: string;
}

export default async function syncBatchActions(
  pendingActions: PendingAction[]
): Promise<{ remaining: PendingAction[]; processed: ProcessedItem[] }> {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("Access token not found");

    const decoded = jwtDecode<{ "cognito:username"?: string; sub: string }>(token);
    const userId = decoded["cognito:username"] ?? decoded.sub;

    const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/batchProcesser`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, actions: pendingActions }),
    });

    const data = await res.json();
    // console.log("✅ Lambda response:", data);

    if (!data.success || !Array.isArray(data.processed)) {
      return { remaining: pendingActions, processed: [] };
    }

    const remaining = pendingActions.filter(
      a =>
        !data.processed.some((p: ProcessedItem) => {
          if (p.type === "like" || p.type === "unlike") {
            return p.crinzId === a.crinzId && a.type === p.type;
          }
          if (p.type === "add_comment" || p.type === "remove_comment") {
            return (
              p.crinzId === a.crinzId &&
              a.type === p.type &&
              ((p.status && p.status.startsWith("comment")) ||
                (p.payload || "").trim() === (typeof a.payload === "string" ? a.payload || "" : JSON.stringify(a.payload || {})).trim())
            );
          }
          return false;
        })
    );

    return { remaining, processed: data.processed };
  } catch (err) {
    console.error("❌ Batch sync failed:", err);
    return { remaining: pendingActions, processed: [] };
  }
}
