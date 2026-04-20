import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "admin" | "manager" | "doctor" | "staff" | "super_admin";

export function useUserRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      setRoles((data || []).map((r: any) => r.role as AppRole));
      setLoading(false);
    })();
  }, [user]);

  const hasRole = (r: AppRole) => roles.includes(r);
  const isAdmin = hasRole("admin");
  const isManager = hasRole("manager");
  // Acesso ao financeiro: somente admin ou manager
  const canAccessFinance = isAdmin || isManager;

  return { roles, loading, hasRole, isAdmin, isManager, canAccessFinance };
}
