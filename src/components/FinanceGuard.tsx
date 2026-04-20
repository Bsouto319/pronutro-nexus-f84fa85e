import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

/** Bloqueia acesso ao Financeiro para quem não é admin/manager. */
export function FinanceGuard({ children }: { children: React.ReactNode }) {
  const { canAccessFinance, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canAccessFinance) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
