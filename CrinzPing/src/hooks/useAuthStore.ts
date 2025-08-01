// hooks/useAuthStore.ts
type AuthData = {
  id_token: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  scope: string;
  expires_at: number;
  profile: {
    sub: string;
    email: string;
    email_verified: boolean;
    cognito_username: string;
    token_use: string;
    aud: string;
    iat: number;
    iss: string;
  };
};

let authObject: AuthData | null = null;

export const setAuthData = (auth: any) => {
  authObject = auth;
  localStorage.setItem("accessToken", auth.access_token);
  localStorage.setItem("idToken", auth.id_token);
  localStorage.setItem("email", auth.profile.email);
  localStorage.setItem("sub", auth.profile.sub);
  // Add more if needed
};

export const getAuthItem = (key: keyof AuthData | keyof AuthData["profile"]) => {
  if (!authObject) return localStorage.getItem(key as string); // fallback
  return (authObject as any)[key] ?? (authObject.profile && (authObject.profile as any)[key]);
};
