import { motion } from "framer-motion";
import { Clock, User, RefreshCw, AlertCircle, Trash2, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useOrganization } from "@/hooks/useOrganization";

interface Appointment {
  id: string | number;
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

export function AppointmentsList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { organizationId } = useOrganization();

  const fetchAppointments = async () => {
    const webhookUrl = localStorage.getItem("nexus_n8n_webhook_url");

    if (!webhookUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      // Chamada ao n8n para buscar os agendamentos reais
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_appointments',
          organizationId: organizationId
        }),
      });

      if (!response.ok) throw new Error('Falha ao conectar com n8n');

      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.appointments || []);

      setAppointments(items);

      // Notifica o Dashboard do total para atualizar os KPIs
      window.dispatchEvent(new CustomEvent("appointments_count_updated", {
        detail: { count: items.length }
      }));
    } catch (err) {
      console.error("Erro ao sincronizar com n8n:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    const webhookUrl = localStorage.getItem("nexus_n8n_webhook_url");
    if (!webhookUrl) return;

    if (!confirm("Deseja excluir este agendamento no n8n e Google Calendar?")) return;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete_appointment',
          appointmentId: id,
          organizationId: organizationId
        }),
      });

      if (!response.ok) throw new Error('Falha ao excluir');

      toast.success("Agendamento removido com sucesso!");
      fetchAppointments();
    } catch (err) {
      toast.error("Erro ao excluir agendamento.");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    window.addEventListener("n8n_url_updated", fetchAppointments);
    return () => window.removeEventListener("n8n_url_updated", fetchAppointments);
  }, [organizationId]);

  if (loading && appointments.length === 0) {
    return (
      <div className="glass rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Sincronizando com Maria AI...</p>
      </div>
    );
  }

  if (error || !localStorage.getItem("nexus_n8n_webhook_url")) {
    const url = localStorage.getItem("nexus_n8n_webhook_url") || "";
    return (
      <div className="glass rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <AlertCircle className="w-10 h-10 text-warning" />
        <div>
          <h3 className="font-display font-semibold text-foreground">Conexão Pendente</h3>
          <p className="text-sm text-muted-foreground mt-2 px-6">
            {!url
              ? "Vá em 'Integrações' e configure a URL do seu workflow n8n para visualizar a agenda em tempo real."
              : "Não foi possível conectar ao n8n. Verifique se o workflow está ativo ou se a URL está correta."}
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-3 h-3" />
          Tentar Denovo
        </button>
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
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monitoramento em tempo real</p>
          </div>
        </div>
        <button
          onClick={fetchAppointments}
          className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground hover:text-primary"
          title="Sincronizar agora"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">Sem consultas para hoje.</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Maria está processando novos leads...</p>
          </div>
        ) : (
          appointments.map((apt, i) => (
            <motion.div
              key={apt.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/30 transition-all group"
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
                <button
                  onClick={(e) => handleDelete(e, apt.id)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
