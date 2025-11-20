// OthersProfileView.tsx (capital O)
import { useParams } from "react-router-dom";
import BaseProfileView from "./BaseProfileView";

export default function OthersProfileView() {
  const { sub } = useParams<{ sub: string }>();

  if (!sub) {
    return <div>User not found</div>;
  }

  return (
    <BaseProfileView
      userSub={sub}
      allowActions={false}
      showEdit={false}
      showSignout={false}
    />
  );
}