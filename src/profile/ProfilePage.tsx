import React from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import AuthenticatedProfileView from "./AuthenticatedProfileView";
import OthersProfileView from "./OthersProfileView";

const ProfilePage: React.FC = () => {
  const { sub } = useParams();
  const auth = useAuth();

  // If no user is specified and user is authenticated, show their own profile
  if (!sub && auth.isAuthenticated) {
    return <AuthenticatedProfileView />;
  }

  // If user is specified, show that user's profile (others profile)
  if (sub) {
    return <OthersProfileView />;
  }

  // If not authenticated and no user specified, show sign in
  return <button onClick={() => auth.signinRedirect()}>Sign In</button>;
};

export default ProfilePage;