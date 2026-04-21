import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface OrgInfo {
  id: string;
  name: string;
  logo_url: string | null;
  legal_name: string | null;
  cnpj: string | null;
  phone: string | null;
  whatsapp: string | null;
  contact_email: string | null;
  address_cep: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  owner_name: string | null;
  owner_cpf: string | null;
  owner_role: string | null;
  onboarding_completed: boolean;
}

interface OrgContextType {
  organizationId: string | null;
  organization: OrgInfo | null;
  loading: boolean;
  isBlocked: boolean;
  refresh: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType>({
  organizationId: null,
  organization: null,
  loading: true,
  isBlocked: false,
  refresh: async () => {},
});

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organization, setOrganization] = useState<OrgInfo | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOrg = useCallback(async () => {
    if (!user) {
      setOrganizationId(null);
      setOrganization(null);
      setIsBlocked(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: mem } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const orgId = mem?.organization_id ?? null;
    setOrganizationId(orgId);

    if (orgId) {
      const [{ data: orgData }, { data: sub }] = await Promise.all([
        supabase.from("organizations").select("*").eq("id", orgId).maybeSingle(),
        supabase.from("org_subscriptions").select("status").eq("organization_id", orgId).maybeSingle(),
      ]);
      setOrganization(orgData as OrgInfo | null);
      setIsBlocked(sub?.status === "blocked");
    } else {
      setOrganization(null);
      setIsBlocked(false);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchOrg(); }, [fetchOrg]);

  return (
    <OrgContext.Provider value={{ organizationId, organization, loading, isBlocked, refresh: fetchOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export const useOrganization = () => useContext(OrgContext);
