import type { ReactNode } from "react";
import { useAuth } from "react-oidc-context";
import { Navigate, useLocation } from "react-router-dom";
import CrinzLoader from "../shared/CrinzLoader";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return <CrinzLoader text="Verifying access..." />;
  }

  // Check for specific authentication errors that require immediate logout
  if (auth.error) {
    const errorMessage = auth.error.message.toLowerCase();

    // Handle critical auth errors that require re-authentication
    if (errorMessage.includes('invalid_grant') ||
      errorMessage.includes('login_required') ||
      errorMessage.includes('session expired')) {

      console.error('ProtectedRoute: Critical auth error -', auth.error);

      // Store current location for return after login
      if (location.pathname !== '/') {
        sessionStorage.setItem("returnTo", location.pathname + location.search);
      }

      // Clear problematic session
      localStorage.removeItem('auth_error');
      localStorage.setItem('manual_logout', 'false');

      return <Navigate to="/" state={{
        message: "Session expired. Please sign in again.",
        error: auth.error.message
      }} replace />;
    }
  }

  if (!auth.isAuthenticated) {
    // Store the attempted URL for redirect after login
    if (location.pathname !== '/') {
      sessionStorage.setItem("returnTo", location.pathname + location.search);
    }

    return <Navigate to="/" state={{
      message: "You must sign in first",
      from: location.pathname
    }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;