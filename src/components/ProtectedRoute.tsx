import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isBlocked, loading: orgLoading } = useOrganization();
  const { isSuperAdmin } = useSuperAdmin();
  const location = useLocation();

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Super admin bypasses block
  if (isBlocked && !isSuperAdmin && location.pathname !== "/blocked") {
    return <Navigate to="/blocked" replace />;
  }

  return <>{children}</>;
}
