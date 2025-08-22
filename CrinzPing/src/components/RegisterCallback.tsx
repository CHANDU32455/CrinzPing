import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";

const RegisterCallback = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) {
      const returnTo = sessionStorage.getItem("returnTo") || "/";
      sessionStorage.removeItem("returnTo"); // clean up
      navigate(returnTo, { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

  return <div>Completing login...</div>;
};

export default RegisterCallback;
