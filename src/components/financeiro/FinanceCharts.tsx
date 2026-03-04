import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useMemo } from "react";

const COLORS = [
  "hsl(168, 80%, 44%)", "hsl(190, 70%, 50%)", "hsl(260, 60%, 55%)",
  "hsl(32, 85%, 55%)", "hsl(350, 70%, 55%)", "hsl(210, 80%, 55%)",
];

const tooltipStyle = {
  backgroundColor: "hsl(220, 25%, 12%)",
  border: "1px solid hsl(220, 20%, 20%)",
  borderRadius: "8px",
  color: "hsl(220, 10%, 92%)",
  fontSize: "12px",
};

export function FinanceCharts() {
  const { doctors, transactions, isLoading } = useFinanceData();

  const doctorData = useMemo(() => {
    return doctors.map(d => ({
      name: d.name,
      value: transactions
        .filter(t => t.doctor === d.name && (t.type as string) === "entrada" && (t.source as string) === "transaction")
        .reduce((sum, t) => sum + (t.valueIn || 0), 0)
    })).sort((a, b) => b.value - a.value);
  }, [doctors, transactions]);

  const paymentData = useMemo(() => {
    const methods = ["Pix", "Cartão", "Dinheiro", "Boleto", "Transferência"];
    return methods.map(method => ({
      name: method,
      total: transactions
        .filter(t => t.paymentMethod?.toLowerCase().includes(method.toLowerCase()) && (t.type as string) === "entrada")
        .reduce((sum, t) => sum + (t.valueIn || 0), 0)
    })).filter(p => p.total > 0);
  }, [transactions]);

  if (isLoading) return <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[250px] animate-pulse bg-muted/20 rounded-xl" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.5 }}
      className="grid grid-cols-1 xl:grid-cols-2 gap-6"
    >
      {/* Doctor doughnut */}
      <div className="glass rounded-xl p-6 card-shadow overflow-hidden">
        <h3 className="font-display font-semibold text-foreground mb-1">📊 Partilha por Médico</h3>
        <p className="text-sm text-muted-foreground mb-4">Participação no faturamento</p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[180px]">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={doctorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {doctorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 flex-1 min-w-[120px]">
            {doctorData.slice(0, 5).map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-2 truncate pr-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground truncate">{item.name}</span>
                </span>
                <span className="text-foreground font-medium">
                  {((item.value / (doctorData.reduce((a, b) => a + b.value, 0) || 1)) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment method bar */}
      <div className="glass rounded-xl p-6 card-shadow overflow-hidden">
        <h3 className="font-display font-semibold text-foreground mb-1">💳 Por Forma de Pagamento</h3>
        <p className="text-sm text-muted-foreground mb-4">Volume por método</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={paymentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 16%)" vertical={false} />
            <XAxis dataKey="name" stroke="hsl(220, 10%, 55%)" fontSize={10} angle={-15} textAnchor="end" height={50} />
            <YAxis stroke="hsl(220, 10%, 55%)" fontSize={10} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
