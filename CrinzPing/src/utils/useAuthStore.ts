type AuthData = {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expires_at?: number;
  profile: {
    sub: string;
    email: string;
    email_verified?: boolean;
    cognito_username?: string;
    token_use?: string;
    aud?: string;
    iat?: number;
    iss?: string;
  };
};

let authObject: AuthData | null = null;

// store user info locally for API calls only
export const setAuthData = (auth: AuthData) => {
  authObject = { ...auth, profile: { ...auth.profile } };

  try {
    localStorage.setItem("id_token", auth.id_token);
    localStorage.setItem("access_token", auth.access_token);
    localStorage.setItem("email", auth.profile.email);
    localStorage.setItem("sub", auth.profile.sub);
  } catch (e) {
    console.error("Failed to save auth data locally", e);
  }
};

// read user info (always fallback to current `authObject`)
export const getAuthItem = (key: keyof AuthData | keyof AuthData["profile"]) => {
  if (!authObject) return localStorage.getItem(key as string);
  return (authObject as any)[key] ?? (authObject.profile as any)[key];
};

// clear stored tokens and object
export const clearAuthData = () => {
  authObject = null;
  localStorage.removeItem("id_token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("email");
  localStorage.removeItem("sub");
};
