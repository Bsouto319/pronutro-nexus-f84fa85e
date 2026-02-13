import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { doctors, paymentMethods } from "./financeData";

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
  const doctorData = doctors.map(d => ({ name: d.name, value: d.revenue }));
  const paymentData = paymentMethods.map(p => ({ name: p.name, total: p.total }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.5 }}
      className="grid grid-cols-1 xl:grid-cols-2 gap-6"
    >
      {/* Doctor doughnut */}
      <div className="glass rounded-xl p-6 card-shadow">
        <h3 className="font-display font-semibold text-foreground mb-1">📊 Faturamento por Médico</h3>
        <p className="text-sm text-muted-foreground mb-4">Participação no faturamento</p>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie data={doctorData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {doctorData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 flex-1">
            {doctorData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-muted-foreground text-xs truncate">{item.name}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment method bar */}
      <div className="glass rounded-xl p-6 card-shadow">
        <h3 className="font-display font-semibold text-foreground mb-1">💳 Por Forma de Pagamento</h3>
        <p className="text-sm text-muted-foreground mb-4">Volume por método</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={paymentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 16%)" />
            <XAxis dataKey="name" stroke="hsl(220, 10%, 55%)" fontSize={10} angle={-15} textAnchor="end" height={50} />
            <YAxis stroke="hsl(220, 10%, 55%)" fontSize={10} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
