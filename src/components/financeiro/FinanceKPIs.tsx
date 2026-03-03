import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, BarChart3, Stethoscope, Users, Receipt } from "lucide-react";
import { formatCurrency } from "./financeData";
import { useFinanceData } from "@/hooks/useFinanceData";

export function FinanceKPIs() {
  const { kpis: data, isLoading } = useFinanceData();

  const kpis = [
    { title: "Total Transações", value: String(data.totalTransacoes), icon: Receipt, type: "neutral" as const },
    { title: "Entradas", value: formatCurrency(data.totalEntradas), icon: TrendingUp, type: "positive" as const },
    { title: "Saídas", value: formatCurrency(data.totalSaidas), icon: TrendingDown, type: "negative" as const },
    { title: "Saldo", value: formatCurrency(data.saldo), icon: BarChart3, type: data.saldo >= 0 ? "positive" as const : "negative" as const },
    { title: "Médicos", value: String(data.totalMedicos), icon: Stethoscope, type: "neutral" as const },
    { title: "Pacientes", value: String(data.totalPacientes), icon: Users, type: "neutral" as const },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 h-24 animate-pulse bg-muted/20" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4 }}
          className="glass rounded-xl p-4 card-shadow hover:border-primary/30 transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              kpi.type === "positive" && "bg-success/10",
              kpi.type === "negative" && "bg-destructive/10",
              kpi.type === "neutral" && "bg-primary/10",
            )}>
              <kpi.icon className={cn(
                "w-4 h-4",
                kpi.type === "positive" && "text-success",
                kpi.type === "negative" && "text-destructive",
                kpi.type === "neutral" && "text-primary",
              )} />
            </div>
          </div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{kpi.title}</p>
          <p className={cn(
            "text-lg font-display font-bold",
            kpi.type === "positive" && "text-success",
            kpi.type === "negative" && "text-destructive",
            kpi.type === "neutral" && "text-foreground",
          )}>
            {kpi.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
