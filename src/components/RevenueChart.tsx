import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Jan", consultas: 120, procedimentos: 85, faturamento: 42000 },
  { name: "Fev", consultas: 145, procedimentos: 98, faturamento: 48000 },
  { name: "Mar", consultas: 160, procedimentos: 110, faturamento: 55000 },
  { name: "Abr", consultas: 135, procedimentos: 92, faturamento: 46000 },
  { name: "Mai", consultas: 178, procedimentos: 125, faturamento: 62000 },
  { name: "Jun", consultas: 195, procedimentos: 140, faturamento: 71000 },
  { name: "Jul", consultas: 210, procedimentos: 155, faturamento: 78000 },
];

export function RevenueChart() {
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
          <p className="text-sm text-muted-foreground">Últimos 7 meses</p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-chart-1" />
            Consultas
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-chart-3" />
            Procedimentos
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(168, 80%, 44%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(168, 80%, 44%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorProc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(260, 60%, 55%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(260, 60%, 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 16%)" />
          <XAxis dataKey="name" stroke="hsl(220, 10%, 55%)" fontSize={12} />
          <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} />
          <Tooltip
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
            dataKey="consultas"
            stroke="hsl(168, 80%, 44%)"
            fill="url(#colorConsultas)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="procedimentos"
            stroke="hsl(260, 60%, 55%)"
            fill="url(#colorProc)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
