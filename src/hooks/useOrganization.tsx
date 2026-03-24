import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OrgContextType {
  organizationId: string | null;
  loading: boolean;
}

const OrgContext = createContext<OrgContextType>({
  organizationId: null,
  loading: true,
});

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrganizationId(null);
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

      if (error) {
        if (import.meta.env.DEV) console.warn("Error fetching organization:", error.message);
      }
      setOrganizationId(data?.organization_id ?? null);
      setLoading(false);
    };

    fetchOrg();
  }, [user]);

  return (
    <OrgContext.Provider value={{ organizationId, loading }}>
      {children}
    </OrgContext.Provider>
  );
}

export const useOrganization = () => useContext(OrgContext);
