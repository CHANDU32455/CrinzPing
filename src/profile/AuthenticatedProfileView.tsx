import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import BaseProfileView from "./BaseProfileView";
import { useUserDetails } from "../hooks/UserInfo";

const AuthenticatedProfileView: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const { userDetails, userError } = useUserDetails(auth.user?.profile?.sub);

  // Redirect first-time users (no record in DB)
  useEffect(() => {
    if (userError?.response?.status === 404) {
      console.log("ℹ️ no user record found → redirecting to /postUserDetails");
      navigate("/postUserDetails", {
        replace: true,
        state: { from: "profile" },
      });
    }
  }, [userError, navigate]);

  const handleEdit = () => {
    (window as any).userDetailsUpdateCallback = (updatedDetails: any) => {
      console.log("User details updated:", updatedDetails);
    };
    navigate("/postUserDetails", { state: { userDetails } });
  };

  return (
    <div style={{ position: "relative" }}>
      <BaseProfileView
        userSub={auth.user?.profile?.sub}
        showEdit={true}
        showSignout={true}
        onEdit={handleEdit}
        allowActions={true}
        currentUserId={auth.user?.profile?.sub}
      />
    </div>
  );
};

export default AuthenticatedProfileView;