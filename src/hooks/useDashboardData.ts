import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

// Get BRT "today" range in UTC
function getTodayBRTRange() {
  const now = new Date();
  // BRT = UTC-3, so "today" in BRT starts at 03:00 UTC
  const brtNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const yyyy = brtNow.getUTCFullYear();
  const mm = String(brtNow.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(brtNow.getUTCDate()).padStart(2, "0");
  const todayBRT = `${yyyy}-${mm}-${dd}`;
  const startUTC = `${todayBRT}T03:00:00+00:00`;
  const nextDay = new Date(Date.UTC(yyyy, brtNow.getUTCMonth(), brtNow.getUTCDate() + 1));
  const nd = `${nextDay.getUTCFullYear()}-${String(nextDay.getUTCMonth() + 1).padStart(2, "0")}-${String(nextDay.getUTCDate()).padStart(2, "0")}`;
  const endUTC = `${nd}T02:59:59+00:00`;
  return { startUTC, endUTC, todayBRT };
}

export function useDashboardData() {
  const { organizationId } = useOrganization();
  const { startUTC, endUTC, todayBRT } = getTodayBRTRange();

  const agendamentosHoje = useQuery({
    queryKey: ["agendamentos_hoje", todayBRT, organizationId],
    enabled: !!organizationId,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("organization_id", organizationId!)
        .gte("data_inicio", startUTC)
        .lte("data_inicio", endUTC)
        .order("data_inicio", { ascending: true });
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
