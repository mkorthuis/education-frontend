import { Navigate } from "react-router-dom";
import { isAuthenticated } from "@features/auth/services/auth";

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};