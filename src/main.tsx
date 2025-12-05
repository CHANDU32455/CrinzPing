import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/app.css";
import { AuthProvider } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";
import ErrorBoundary from "./components/shared/ErrorBoundary";

const cognitoAuthConfig = {
  authority: import.meta.env.VITE_COGNITO_AUTHORITY,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI,
  response_type: "code",
  scope: "openid email phone",
  automaticSilentRenew: true,
  silent_redirect_uri: import.meta.env.VITE_COGNITO_SILENT_REDIRECT_URI,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  // Add these configurations to handle state errors gracefully
  revokeTokensOnSignout: false,
  monitorSession: false, // Set to false to prevent automatic session checks
  checkSessionInterval: 0, // Disable automatic session checking
};

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </ErrorBoundary>
);