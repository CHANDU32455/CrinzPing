export interface Comment {
  commentId: string;
  crinzId: string;
  comment: string;
  timestamp: number;
  userId: string;
}

export const fetchComments = async (
  crinzId: string, 
  accessToken: string, 
  lastKey: any = null, 
  limit: number = 15
): Promise<{ comments: Comment[]; lastKey: any }> => {
  if (!accessToken) {
    throw new Error("Authorization token missing");
  }

  const bodyPayload: any = { crinzId, limit };
  if (lastKey) bodyPayload.lastKey = lastKey;

  const res = await fetch(import.meta.env.VITE_GET_COMMENTS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Unauthorized access");
    } else {
      throw new Error(`Failed to fetch comments: ${res.status}`);
    }
  }

  const data = await res.json();
  return {
    comments: data.comments || [],
    lastKey: data.lastKey || null
  };
};