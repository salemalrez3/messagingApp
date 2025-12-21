import { Navigate } from "react-router-dom";
import type { JSX } from "react";
import { useAuth } from "../context/authContext";

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}
