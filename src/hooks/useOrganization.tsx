import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OrgContextType {
  organizationId: string | null;
  loading: boolean;
  isBlocked: boolean;
}

const OrgContext = createContext<OrgContextType>({
  organizationId: null,
  loading: true,
  isBlocked: false,
});

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrganizationId(null);
      setIsBlocked(false);
      setLoading(false);
      return;
    }

    const fetchOrg = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (error && import.meta.env.DEV) console.warn("Error fetching organization:", error.message);
      const orgId = data?.organization_id ?? null;
      setOrganizationId(orgId);

      if (orgId) {
        const { data: sub } = await supabase
          .from("org_subscriptions")
          .select("status")
          .eq("organization_id", orgId)
          .maybeSingle();
        setIsBlocked(sub?.status === "blocked");
      } else {
        setIsBlocked(false);
      }
      setLoading(false);
    };

    fetchOrg();
  }, [user]);

  return (
    <OrgContext.Provider value={{ organizationId, loading, isBlocked }}>
      {children}
    </OrgContext.Provider>
  );
}

export const useOrganization = () => useContext(OrgContext);
