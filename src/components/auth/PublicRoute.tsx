import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { getSession } from "../../utils/session";

type Props = {
  children: ReactNode;
};

export default function PublicRoute({ children }: Props) {
  const user = getSession();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}