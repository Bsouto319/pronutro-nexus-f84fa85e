import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { KPICard } from "@/components/KPICard";
import { RevenueChart } from "@/components/RevenueChart";
import { AppointmentsList } from "@/components/AppointmentsList";
import { DoctorsGrid } from "@/components/DoctorsGrid";
import { ProceduresChart } from "@/components/ProceduresChart";
import { Users, Calendar, DollarSign, Activity } from "lucide-react";
import { useFinanceData } from "@/hooks/useFinanceData";

const Index = () => {
  const { kpis: financeKpis, isLoading } = useFinanceData();

  const formattedKpis = [
    {
      title: "Total Pacientes",
      value: isLoading ? "..." : financeKpis.totalPacientes.toString(),
      change: "+5%",
      changeType: "positive" as const,
      icon: Users
    },
    {
      title: "Consultas Hoje",
      value: "24", // Still static until we have a real agenda hook
      change: "+3",
      changeType: "positive" as const,
      icon: Calendar
    },
    {
      title: "Saldo Geral",
      value: isLoading ? "..." : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financeKpis.saldo),
      change: "+12%",
      changeType: "positive" as const,
      icon: DollarSign
    },
    {
      title: "Médicos Ativos",
      value: isLoading ? "..." : financeKpis.totalMedicos.toString(),
      change: "0%",
      changeType: "positive" as const,
      icon: Activity
    },
  ];

  return (
    <AppLayout>
      <TopBar title="Nexus AI Dashboard" subtitle="Visão geral da sua clínica em tempo real" />
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {formattedKpis.map((kpi, i) => (
            <KPICard key={kpi.title} {...kpi} index={i} />
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RevenueChart />
          </div>
          <ProceduresChart />
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AppointmentsList />
          <DoctorsGrid />
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
