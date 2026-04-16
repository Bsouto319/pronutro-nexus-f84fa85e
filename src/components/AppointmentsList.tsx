import { motion } from "framer-motion";
import { Clock, User, RefreshCw, CalendarDays } from "lucide-react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";

interface Appointment {
  id: string;
  patient: string;
  doctor: string;
  time: string;
  procedure: string;
  status: "confirmed" | "pending" | "cancelled";
}

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

function mapStatus(status?: string | null): Appointment["status"] {
  if (status === "confirmado" || status === "confirmed") return "confirmed";
  if (status === "cancelado" || status === "cancelled") return "cancelled";
  return "pending";
}

export function AppointmentsList() {
  const { organizationId } = useOrganization();

  const { data: appointments = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["dashboard_appointments", organizationId],
    refetchInterval: 30000,
    queryFn: async (): Promise<Appointment[]> => {
      // BRT = UTC-3: "today" in BRT starts at 03:00 UTC
      const now = new Date();
      const brtNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      const yyyy = brtNow.getUTCFullYear();
      const mm = String(brtNow.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(brtNow.getUTCDate()).padStart(2, "0");
      const todayStart = `${yyyy}-${mm}-${dd}T03:00:00+00:00`;
      const nextDay = new Date(Date.UTC(yyyy, brtNow.getUTCMonth(), brtNow.getUTCDate() + 1));
      const tomorrowEnd = `${nextDay.getUTCFullYear()}-${String(nextDay.getUTCMonth() + 1).padStart(2, "0")}-${String(nextDay.getUTCDate()).padStart(2, "0")}T02:59:59+00:00`;
      
      let query = supabase
        .from("agendamentos")
        .select("id, patient_name, paciente_nome, doctor_name, profissional, time, data_inicio, notes, status");

      if (organizationId) {
        query = query.eq("organization_id", organizationId);
      }

      const { data, error } = await query
        .gte("data_inicio", todayStart)
        .lte("data_inicio", tomorrowEnd)
        .order("data_inicio", { ascending: true, nullsFirst: false });

      if (error) {
        if (import.meta.env.DEV) console.error("Erro ao buscar agendamentos:", error);
        throw error;
      }

      return (data || []).map((item: any) => {
        const name = item.paciente_nome || item.patient_name || "Paciente";
        const doctor = item.profissional || item.doctor_name || "A definir";
        let time = item.time || "--:--";
        if (item.data_inicio) {
          const d = new Date(item.data_inicio);
          // Convert to BRT (UTC-3)
          d.setHours(d.getHours() - 3);
          time = d.toISOString().slice(11, 16);
        }
        return {
          id: item.id,
          patient: name,
          doctor,
          time,
          procedure: item.notes || "Consulta",
          status: mapStatus(item.status),
        };
      });
    },
  });

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("appointments_count_updated", {
      detail: { count: appointments.length },
    }));
  }, [appointments.length]);

  if (loading && appointments.length === 0) {
    return (
      <div className="glass rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Sincronizando agenda do banco...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6 card-shadow h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Agenda Sincronizada</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Atualização automática a cada 30s</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground hover:text-primary"
          title="Sincronizar agora"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">Sem consultas para hoje.</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Assim que o workflow gravar no banco, aparece aqui.</p>
          </div>
        ) : (
          appointments.map((apt, i) => (
            <motion.div
              key={apt.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/30 transition-all"
            >
              <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-border/50 pr-3">
                <span className="text-xs font-bold text-primary">{apt.time}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{apt.patient}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <User className="w-3 h-3 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground truncate">{apt.doctor} · {apt.procedure}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${statusStyles[apt.status] || "bg-muted text-muted-foreground"}`}>
                  {statusLabels[apt.status] || "Pendente"}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
