import { API_ENDPOINTS } from "../constants/apiEndpoints";

export interface Comment {
  commentId: string;
  crinzId: string;
  comment: string;
  timestamp: number;
  userId: string;
  userName?: string;
  userProfilePic?: string;
  userTagline?: string;
}

const GET_COMMENTS_API_URL = `${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.GET_POST_COMMENTS}`;
interface LastKey {
  [key: string]: unknown; // Or be more specific if you know the structure
}

interface BodyPayload {
  crinzId: string;
  limit: number;
  lastKey?: LastKey;
}

interface FetchCommentsResponse {
  comments: Comment[];
  lastKey: LastKey | null;
}

export const fetchComments = async (
  crinzId: string,
  accessToken: string,
  lastKey: LastKey | null = null,
  limit: number = 15
): Promise<FetchCommentsResponse> => {
  if (!accessToken) {
    throw new Error("Authorization token missing");
  }

  const bodyPayload: BodyPayload = { crinzId, limit };
  if (lastKey) bodyPayload.lastKey = lastKey;

  const res = await fetch(GET_COMMENTS_API_URL, {
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