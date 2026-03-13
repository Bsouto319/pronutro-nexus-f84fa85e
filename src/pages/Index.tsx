import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { KPICard } from "@/components/KPICard";
import { RevenueChart } from "@/components/RevenueChart";
import { AppointmentsList } from "@/components/AppointmentsList";
import { DoctorsGrid } from "@/components/DoctorsGrid";
import { ProceduresChart } from "@/components/ProceduresChart";
import { LeadStatsRow } from "@/components/kanban/LeadStatsRow";
import { Users, Calendar, DollarSign, Activity } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useOrganization } from "@/hooks/useOrganization";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useMemo } from "react";

const Index = () => {
  const { consultasHoje, totalPacientes, saldoGeral, isLoading: dashLoading, refetch: refetchDash } = useDashboardData();
  const { kpis: financeKpis, isLoading: finLoading, refetch: refetchFin } = useFinanceData();
  const { organizationId } = useOrganization();
  const [appointmentCount, setAppointmentCount] = useState(0);

  const { data: leads } = useQuery({
    queryKey: ["dashboard_leads", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("id, status, created_at").eq("organization_id", organizationId!);
      return data || [];
    },
    refetchInterval: 30000,
  });

  const isLoading = dashLoading || finLoading;

  const handleRefresh = () => { refetchDash(); refetchFin(); };

  useEffect(() => {
    const handleCountUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail?.count === "number") setAppointmentCount(detail.count);
    };
    window.addEventListener("appointments_count_updated", handleCountUpdate);
    return () => window.removeEventListener("appointments_count_updated", handleCountUpdate);
  }, []);

  const leadStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayLeads = leads?.filter(l => l.created_at.slice(0, 10) === today).length || 0;
    const aguardando = leads?.filter(l => l.status === "qualificado").length || 0;
    const total = leads?.length || 1;
    const atendidos = leads?.filter(l => l.status !== "novo_lead").length || 0;
    const taxa = Math.round((atendidos / total) * 100);
    return { leadsHoje: todayLeads, consultasHoje: appointmentCount || consultasHoje, taxaResposta: taxa, aguardandoHumano: aguardando };
  }, [leads, appointmentCount, consultasHoje]);

  const formattedKpis = [
    {
      title: "Total Pacientes",
      value: isLoading ? "..." : (totalPacientes || financeKpis.totalPacientes).toString(),
      change: financeKpis.totalPacientes > 0 ? `${financeKpis.totalPacientes}` : "0",
      changeType: "positive" as const,
      icon: Users,
    },
    {
      title: "Consultas Hoje",
      value: isLoading ? "..." : (appointmentCount || consultasHoje).toString(),
      change: appointmentCount > 0 ? `${appointmentCount}` : "0",
      changeType: "positive" as const,
      icon: Calendar,
    },
    {
      title: "Saldo Geral",
      value: isLoading ? "..." : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(financeKpis.saldo || saldoGeral),
      change: financeKpis.saldo >= 0 ? "+R$" : "-R$",
      changeType: (financeKpis.saldo || saldoGeral) >= 0 ? "positive" as const : "negative" as const,
      icon: DollarSign,
    },
    {
      title: "Médicos Ativos",
      value: isLoading ? "..." : financeKpis.totalMedicos.toString(),
      change: financeKpis.totalMedicos > 0 ? `${financeKpis.totalMedicos}` : "0",
      changeType: "positive" as const,
      icon: Activity,
    },
  ];

  return (
    <AppLayout>
      <TopBar title="Nexus AI Dashboard" subtitle="Visão geral da sua clínica em tempo real" onRefresh={handleRefresh} />
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        <LeadStatsRow {...leadStats} />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {formattedKpis.map((kpi, i) => (
            <KPICard key={kpi.title} {...kpi} index={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RevenueChart />
          </div>
          <ProceduresChart />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AppointmentsList />
          <DoctorsGrid />
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
