import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ user, role, children }) {
  if (!user) return <Navigate to="/" />;
  if (role === "admin" && user.role !== "admin") return <Navigate to="/" />;
  if (role === "guest" && user.role !== "guest" && user.role !== "admin")
    return <Navigate to="/" />;
  return children;
}
