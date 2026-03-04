import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_ORG_ID = "65777d18-1126-481d-93d9-169237388d7f";

export function useDashboardData() {
  const today = new Date().toISOString().split("T")[0];

  const agendamentosHoje = useQuery({
    queryKey: ["agendamentos_hoje", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos" as any)
        .select("*")
        .eq("organization_id", DEFAULT_ORG_ID)
        .eq("date", today);
      if (error) { console.warn("agendamentos:", error.message); return []; }
      return data || [];
    },
  });

  const leadsCount = useQuery({
    queryKey: ["leads_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("leads" as any)
        .select("*", { count: "exact", head: true })
        .eq("organization_id", DEFAULT_ORG_ID);
      if (error) { console.warn("leads:", error.message); return 0; }
      return count || 0;
    },
  });

  const gastosTotal = useQuery({
    queryKey: ["gastos_total"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gastos" as any)
        .select("valor")
        .eq("organization_id", DEFAULT_ORG_ID);
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
