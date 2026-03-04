import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useMemo } from "react";

export function ProceduresChart() {
  const { transactions } = useFinanceData();

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    transactions.forEach((t) => {
      const cat = t.category || "outros";
      counts[cat] = (counts[cat] || 0) + 1;
      total++;
    });

    if (total === 0)
      return [{ name: "Sem dados", value: 100 }];

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        value: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  const COLORS = [
    "hsl(168, 80%, 44%)",
    "hsl(190, 70%, 50%)",
    "hsl(260, 60%, 55%)",
    "hsl(32, 85%, 55%)",
    "hsl(350, 70%, 55%)",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.5 }}
      className="glass rounded-xl p-6 card-shadow"
    >
      <h3 className="font-display font-semibold text-foreground mb-1">Categorias de Gastos</h3>
      <p className="text-sm text-muted-foreground mb-4">Distribuição por categoria</p>

      <div className="flex items-center gap-4">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 25%, 12%)",
                border: "1px solid hsl(220, 20%, 20%)",
                borderRadius: "8px",
                color: "hsl(220, 10%, 92%)",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="space-y-2 flex-1">
          {chartData.map((item, i) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground truncate max-w-[100px]">{item.name}</span>
              </span>
              <span className="font-medium text-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
