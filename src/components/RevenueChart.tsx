import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useMemo } from "react";

export function RevenueChart() {
  const { transactions, isLoading } = useFinanceData();

  const chartData = useMemo(() => {
    // Group transactions by month for the last 6 months
    const groups: Record<string, { name: string; entradas: number; saidas: number }> = {};
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // Initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      groups[key] = { name: months[d.getMonth()], entradas: 0, saidas: 0 };
    }

    transactions.forEach(t => {
      // t.date is in DD/MM format from useFinanceData
      const [day, month] = t.date.split("/").map(Number);
      if (!day || !month) return;

      const year = now.getFullYear(); // Assumption: current year or previous if month > current
      const d = new Date(year, month - 1, day);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;

      if (groups[key]) {
        if ((t.type as string) === "entrada") groups[key].entradas += (t.valueIn || 0);
        else groups[key].saidas += (t.valueOut || 0);
      }
    });

    return Object.values(groups);
  }, [transactions]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="glass rounded-xl p-6 card-shadow"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-semibold text-foreground">Faturamento</h3>
          <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-chart-1" />
            Entradas
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-chart-3" />
            Saídas
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(168, 80%, 44%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(168, 80%, 44%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(346, 80%, 60%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(346, 80%, 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 16%)" />
          <XAxis dataKey="name" stroke="hsl(220, 10%, 55%)" fontSize={12} />
          <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} />
          <Tooltip
            formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
            contentStyle={{
              backgroundColor: "hsl(220, 25%, 12%)",
              border: "1px solid hsl(220, 20%, 20%)",
              borderRadius: "8px",
              color: "hsl(220, 10%, 92%)",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="entradas"
            name="Entradas"
            stroke="hsl(168, 80%, 44%)"
            fill="url(#colorEntradas)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="saidas"
            name="Saídas"
            stroke="hsl(346, 80%, 60%)"
            fill="url(#colorSaidas)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
