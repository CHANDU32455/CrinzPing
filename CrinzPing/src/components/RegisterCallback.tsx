import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";

const RegisterCallback = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait until auth state updates
    if (auth.isAuthenticated) {
      const returnTo = sessionStorage.getItem("returnTo") || "/";
      sessionStorage.removeItem("returnTo");
      navigate(returnTo, { replace: true });
    } else if (!auth.isLoading && !auth.isAuthenticated) {
      // fallback if login failed
      navigate("/", { replace: true });
    }
  }, [auth.isAuthenticated, auth.isLoading, navigate]);

  return <div>Completing login...</div>;
};

export default RegisterCallback;
