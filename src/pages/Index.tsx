import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { KPICard } from "@/components/KPICard";
import { RevenueChart } from "@/components/RevenueChart";
import { AppointmentsList } from "@/components/AppointmentsList";
import { DoctorsGrid } from "@/components/DoctorsGrid";
import { ProceduresChart } from "@/components/ProceduresChart";
import { Users, Calendar, DollarSign, Activity, RefreshCw } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useFinanceData } from "@/hooks/useFinanceData";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { consultasHoje, totalPacientes, saldoGeral, isLoading, refetch: refetchDash } = useDashboardData();
  const { kpis: financeKpis, isLoading: finLoading, refetch: refetchFin } = useFinanceData();

  const handleRefresh = () => { refetchDash(); refetchFin(); };

  const formattedKpis = [
    {
      title: "Total Pacientes",
      value: isLoading ? "..." : totalPacientes.toString(),
      change: "",
      changeType: "positive" as const,
      icon: Users,
    },
    {
      title: "Consultas Hoje",
      value: isLoading ? "..." : consultasHoje.toString(),
      change: "",
      changeType: "positive" as const,
      icon: Calendar,
    },
    {
      title: "Saldo Geral",
      value: isLoading ? "..." : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(saldoGeral),
      change: "",
      changeType: saldoGeral >= 0 ? "positive" as const : "negative" as const,
      icon: DollarSign,
    },
    {
      title: "Médicos Ativos",
      value: finLoading ? "..." : financeKpis.totalMedicos.toString(),
      change: "",
      changeType: "positive" as const,
      icon: Activity,
    },
  ];

  return (
    <AppLayout>
      <TopBar title="Nexus AI Dashboard" subtitle="Visão geral da sua clínica em tempo real" onRefresh={handleRefresh} />
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
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
