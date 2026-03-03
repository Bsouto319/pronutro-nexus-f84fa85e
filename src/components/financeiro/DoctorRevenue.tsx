import { motion } from "framer-motion";
import { formatCurrency } from "./financeData";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useMemo } from "react";

const COLORS = ["#d946ef", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

export function DoctorRevenue() {
  const { doctors, transactions, isLoading } = useFinanceData();

  const doctorStats = useMemo(() => {
    return doctors.map((doc, i) => ({
      ...doc,
      patients: doc.patients_count || 0,
      color: COLORS[i % COLORS.length]
    })).sort((a, b) => b.revenue - a.revenue);
  }, [doctors]);

  if (isLoading) return <div className="glass rounded-xl p-12 animate-pulse bg-muted/20 h-[300px]" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="glass rounded-xl p-6 card-shadow"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-semibold text-foreground">👨‍⚕️ Faturamento por Médico</h3>
          <p className="text-sm text-muted-foreground">{doctorStats.length} profissionais</p>
        </div>
      </div>

      <div className="space-y-3">
        {doctorStats.map((doc, i) => {
          const maxRevenue = doctorStats[0]?.revenue || 1;
          const percentage = (doc.revenue / maxRevenue) * 100;
          return (
            <motion.div
              key={doc.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${doc.color}, ${doc.color}dd)` }}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                  <span className="text-sm font-bold text-success ml-2 flex-shrink-0">{formatCurrency(doc.revenue)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.6 + i * 0.08, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: doc.color }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{doc.patients} pac.</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
