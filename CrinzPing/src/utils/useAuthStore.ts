// utils/authUtils.ts
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

export const setAuthData = (auth: AuthData) => {
  try {
    const payload = JSON.parse(atob(auth.id_token.split(".")[1]));
    const cognitoUsername = payload["cognito:username"];

    authObject = {
      ...auth,
      profile: {
        ...auth.profile,
        cognito_username: cognitoUsername,
      },
    };

    localStorage.setItem("id_token", auth.id_token);
    localStorage.setItem("access_token", auth.access_token);
    localStorage.setItem("email", auth.profile.email);
    localStorage.setItem("sub", auth.profile.sub);
    localStorage.setItem("cognito_username", cognitoUsername);

    //console.log("Auth data set:", authObject.profile);
    //console.log("access tkn: ", auth.access_token)
  } catch (e) {
    console.error("Error decoding token", e);
  }
};

export const getAuthItem = (key: keyof AuthData | keyof AuthData["profile"]) => {
  if (!authObject) return localStorage.getItem(key as string); // fallback
  return (authObject as any)[key] ?? (authObject.profile && (authObject.profile as any)[key]);
};

export const clearAuthData = () => {
  authObject = null;
  localStorage.removeItem("id_token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("email");
  localStorage.removeItem("sub");
  localStorage.removeItem("cognito_username");
};
