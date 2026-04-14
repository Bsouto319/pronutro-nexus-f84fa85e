import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, BarChart3, Stethoscope, Users, Receipt } from "lucide-react";
import { formatCurrency } from "./financeData";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useMemo } from "react";
import { PeriodRange } from "./PeriodFilter";

function parseTransactionDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length >= 2) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();
      return new Date(year, month, day);
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

interface FinanceKPIsProps {
  period?: PeriodRange;
}

export function FinanceKPIs({ period }: FinanceKPIsProps) {
  const { transactions, kpis: data, isLoading } = useFinanceData();

  const filteredKpis = useMemo(() => {
    if (!period) return data;

    const filtered = transactions.filter(t => {
      const d = parseTransactionDate(t.date);
      if (!d) return true;
      return d >= period.from && d <= period.to;
    });

    const totalEntradas = filtered.filter(t => t.type === "entrada").reduce((acc, t) => acc + (t.valueIn || 0), 0);
    const totalSaidas = filtered.filter(t => t.type === "saida").reduce((acc, t) => acc + (t.valueOut || 0), 0);

    return {
      totalTransacoes: filtered.length,
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
      totalMedicos: data.totalMedicos,
      totalPacientes: data.totalPacientes,
    };
  }, [transactions, period, data]);

  const kpis = [
    { title: "Total Transações", value: String(filteredKpis.totalTransacoes), icon: Receipt, type: "neutral" as const },
    { title: "Entradas", value: formatCurrency(filteredKpis.totalEntradas), icon: TrendingUp, type: "positive" as const },
    { title: "Saídas", value: formatCurrency(filteredKpis.totalSaidas), icon: TrendingDown, type: "negative" as const },
    { title: "Saldo", value: formatCurrency(filteredKpis.saldo), icon: BarChart3, type: filteredKpis.saldo >= 0 ? "positive" as const : "negative" as const },
    { title: "Médicos", value: String(filteredKpis.totalMedicos), icon: Stethoscope, type: "neutral" as const },
    { title: "Pacientes", value: String(filteredKpis.totalPacientes), icon: Users, type: "neutral" as const },
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
