import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { getBrtUtcRange } from "@/lib/datetime";

function getTodayBRTRange() {
  const now = new Date();
  const todayBRT = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const { startUTC, endUTC } = getBrtUtcRange(now);
  return { startUTC, endUTC, todayBRT };
}

export function useDashboardData() {
  const { organizationId } = useOrganization();
  const { startUTC, endUTC, todayBRT } = getTodayBRTRange();

  const agendamentosHoje = useQuery({
    queryKey: ["agendamentos_hoje", todayBRT, organizationId],
    refetchInterval: 30000,
    queryFn: async () => {
      let query = supabase
        .from("agendamentos")
        .select("id")
        .gte("data_inicio", startUTC)
        .lte("data_inicio", endUTC)
        .order("data_inicio", { ascending: true });

      if (organizationId) {
        query = query.eq("organization_id", organizationId);
      }

      const { data, error } = await query;
      if (error) { if (import.meta.env.DEV) console.warn("agendamentos:", error.message); return []; }
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
      if (error) { if (import.meta.env.DEV) console.warn("leads:", error.message); return 0; }
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
      if (error) { if (import.meta.env.DEV) console.warn("gastos:", error.message); return 0; }
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
