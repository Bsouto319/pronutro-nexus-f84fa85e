import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFinanceData } from "@/hooks/useFinanceData";

const colors = [
  "from-primary to-info",
  "from-chart-3 to-primary",
  "from-chart-4 to-chart-5",
  "from-info to-chart-3",
  "from-primary to-chart-2",
  "from-chart-5 to-chart-4",
];

export function DoctorsGrid() {
  const navigate = useNavigate();
  const { doctors, isLoading } = useFinanceData();

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6 min-h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Carregando médicos...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="glass rounded-xl p-6 card-shadow"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-semibold text-foreground">Equipe Médica</h3>
          <p className="text-sm text-muted-foreground">{doctors.length} profissionais ativos</p>
        </div>
        <button
          onClick={() => navigate("/medicos")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Médico
        </button>
      </div>

      {doctors.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground">Nenhum médico cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {doctors.map((doc, i) => (
            <motion.div
              key={doc.id || doc.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200 cursor-pointer group"
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center mb-3 text-primary-foreground font-bold text-xs`}>
                {doc.name ? doc.name.substring(0, 2).toUpperCase() : "DR"}
              </div>
              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {doc.name}
              </p>
              <p className="text-xs text-muted-foreground mb-2 truncate">{doc.specialty}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Ativo</span>
                <span className="text-warning">★ 5.0</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
