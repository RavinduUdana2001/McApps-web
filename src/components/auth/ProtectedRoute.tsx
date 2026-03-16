import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { getSession } from "../../utils/session";

type Props = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const user = getSession();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}