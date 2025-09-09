import React from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import AuthenticatedProfileView from "./AuthenticatedProfileView";
import PublicProfileView from "./PublicProfileView";

const ProfilePage: React.FC = () => {
  const { sub } = useParams();
  const auth = useAuth();

  if (!auth.isAuthenticated && !sub) {
    return <button onClick={() => auth.signinRedirect()}>Sign In</button>;
  }

  if (auth.isAuthenticated && !sub) {
    return <AuthenticatedProfileView />;
  }

  return <PublicProfileView />;
};

export default ProfilePage;
