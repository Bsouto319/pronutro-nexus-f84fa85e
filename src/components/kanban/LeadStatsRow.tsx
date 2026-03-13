import { motion } from "framer-motion";
import { Users, Calendar, Bot, MessageSquare } from "lucide-react";

interface LeadStatsRowProps {
  leadsHoje: number;
  consultasHoje: number;
  taxaResposta: number;
  aguardandoHumano: number;
}

export function LeadStatsRow({ leadsHoje, consultasHoje, taxaResposta, aguardandoHumano }: LeadStatsRowProps) {
  const stats = [
    { label: "Leads Hoje", value: leadsHoje.toString(), icon: Users, color: "text-blue-500" },
    { label: "Consultas Hoje", value: consultasHoje.toString(), icon: Calendar, color: "text-emerald-500" },
    { label: "Resposta Bot", value: `${taxaResposta}%`, icon: Bot, color: "text-amber-500" },
    { label: "Aguardando Humano", value: aguardandoHumano.toString(), icon: MessageSquare, color: "text-destructive", badge: aguardandoHumano > 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass rounded-xl p-4 flex items-center gap-3"
        >
          <div className={`w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center ${s.color}`}>
            <s.icon className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">{s.label}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-display font-bold text-foreground">{s.value}</p>
              {s.badge && (
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
