import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

export function useDashboardData() {
  const { organizationId } = useOrganization();
  const today = new Date().toISOString().split("T")[0];

  const agendamentosHoje = useQuery({
    queryKey: ["agendamentos_hoje", today, organizationId],
    enabled: !!organizationId,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("organization_id", organizationId!)
        .eq("date", today)
        .order("time", { ascending: true });
      if (error) { console.warn("agendamentos:", error.message); return []; }
      return data || [];
    },
  });

  const leadsCount = useQuery({
    queryKey: ["leads_count", organizationId],
    enabled: !!organizationId,
    refetchInterval: 30000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId!);
      if (error) { console.warn("leads:", error.message); return 0; }
      return count || 0;
    },
  });

  const gastosTotal = useQuery({
    queryKey: ["gastos_total", organizationId],
    enabled: !!organizationId,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gastos")
        .select("valor")
        .eq("organization_id", organizationId!);
      if (error) { console.warn("gastos:", error.message); return 0; }
      return (data || []).reduce((acc: number, g: any) => acc + (g.valor || 0), 0);
    },
  });

  return {
    consultasHoje: (agendamentosHoje.data || []).length,
    totalPacientes: leadsCount.data || 0,
    saldoGeral: -(gastosTotal.data || 0),
    isLoading: agendamentosHoje.isLoading || leadsCount.isLoading || gastosTotal.isLoading,
    refetch: () => {
      agendamentosHoje.refetch();
      leadsCount.refetch();
      gastosTotal.refetch();
    },
  };
}
