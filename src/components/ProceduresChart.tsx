import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Botox", value: 35 },
  { name: "Harmonização", value: 25 },
  { name: "Peeling", value: 18 },
  { name: "Consulta Nutro", value: 15 },
  { name: "Outros", value: 7 },
];

const COLORS = [
  "hsl(168, 80%, 44%)",
  "hsl(190, 70%, 50%)",
  "hsl(260, 60%, 55%)",
  "hsl(32, 85%, 55%)",
  "hsl(350, 70%, 55%)",
];

export function ProceduresChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.5 }}
      className="glass rounded-xl p-6 card-shadow"
    >
      <h3 className="font-display font-semibold text-foreground mb-1">Procedimentos</h3>
      <p className="text-sm text-muted-foreground mb-4">Distribuição mensal</p>

      <div className="flex items-center gap-4">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
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
          {data.map((item, i) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-muted-foreground">{item.name}</span>
              </span>
              <span className="font-medium text-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
