import type { ReactNode } from "react";
import { useAuth } from "react-oidc-context";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const auth = useAuth();

  if (auth.isLoading) {
    return <div style={{ color: "#00ffcc", textAlign: "center", marginTop: "2rem" }}>Loading...</div>;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/" state={{ message: "You must sign in first" }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
