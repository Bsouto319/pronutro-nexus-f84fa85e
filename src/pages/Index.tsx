import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { KPICard } from "@/components/KPICard";
import { RevenueChart } from "@/components/RevenueChart";
import { AppointmentsList } from "@/components/AppointmentsList";
import { DoctorsGrid } from "@/components/DoctorsGrid";
import { ProceduresChart } from "@/components/ProceduresChart";
import { Users, Calendar, DollarSign, Activity } from "lucide-react";

const kpis = [
  { title: "Total Pacientes", value: "1.284", change: "+12%", changeType: "positive" as const, icon: Users },
  { title: "Consultas Hoje", value: "24", change: "+3", changeType: "positive" as const, icon: Calendar },
  { title: "Faturamento Mensal", value: "R$ 78.400", change: "+18%", changeType: "positive" as const, icon: DollarSign },
  { title: "Procedimentos", value: "156", change: "+8%", changeType: "positive" as const, icon: Activity },
];

const Index = () => {
  return (
    <AppLayout>
      <TopBar />
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
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
