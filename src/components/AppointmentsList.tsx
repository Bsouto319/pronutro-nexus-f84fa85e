import { motion } from "framer-motion";
import { Clock, User } from "lucide-react";

const appointments = [
  { id: 1, patient: "Maria Silva", doctor: "Dr. Carlos Mendes", time: "09:00", procedure: "Botox", status: "confirmed" },
  { id: 2, patient: "João Santos", doctor: "Dra. Ana Lima", time: "09:30", procedure: "Consulta Nutro", status: "confirmed" },
  { id: 3, patient: "Fernanda Costa", doctor: "Dr. Pedro Alves", time: "10:00", procedure: "Peeling", status: "pending" },
  { id: 4, patient: "Ricardo Oliveira", doctor: "Dra. Juliana Rocha", time: "10:30", procedure: "Avaliação", status: "confirmed" },
  { id: 5, patient: "Camila Ferreira", doctor: "Dr. Lucas Neto", time: "11:00", procedure: "Harmonização", status: "pending" },
  { id: 6, patient: "Bruno Almeida", doctor: "Dra. Patrícia Souza", time: "11:30", procedure: "Bioimpedância", status: "confirmed" },
];

const statusStyles: Record<string, string> = {
  confirmed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  cancelled: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmado",
  pending: "Pendente",
  cancelled: "Cancelado",
};

export function AppointmentsList() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="glass rounded-xl p-6 card-shadow"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-semibold text-foreground">Agenda de Hoje</h3>
          <p className="text-sm text-muted-foreground">6 consultas agendadas</p>
        </div>
        <button className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
          Ver todas →
        </button>
      </div>

      <div className="space-y-3">
        {appointments.map((apt, i) => (
          <motion.div
            key={apt.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.05 }}
            className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2 text-muted-foreground min-w-[60px]">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">{apt.time}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{apt.patient}</p>
              <p className="text-xs text-muted-foreground truncate">{apt.doctor} · {apt.procedure}</p>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyles[apt.status]}`}>
              {statusLabels[apt.status]}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
