import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";

const cognitoAuthConfig = {
  authority: import.meta.env.VITE_COGNITO_AUTHORITY,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI,
  response_type: "code",
  scope: "openid email phone",
  automaticSilentRenew: true,
  silent_redirect_uri: import.meta.env.VITE_COGNITO_SILENT_REDIRECT_URI,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
};

createRoot(document.getElementById("root")!).render(
  <AuthProvider {...cognitoAuthConfig}>
    <App />
  </AuthProvider>
);
{/**
  
import React from "react";
<React.StrictMode>
</React.StrictMode>

*/}