import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/portal";

interface Props {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/portal/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    if (profile.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/portal/dashboard" replace />;
  }

  return <Outlet />;
}
