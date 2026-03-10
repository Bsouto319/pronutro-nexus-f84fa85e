import { motion } from "framer-motion";
import { Clock, User, RefreshCw, AlertCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

  const fetchAppointments = async () => {
    const webhookUrl = localStorage.getItem("nexus_n8n_webhook_url");

    if (!webhookUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'get_appointments' }),
      });

      if (!response.ok) throw new Error('Falha ao buscar agenda');

      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.appointments || []);
      setAppointments(items);
      // Emit count to KPI card in Index.tsx (avoids duplicate webhook call)
      window.dispatchEvent(new CustomEvent("appointments_count_updated", { detail: { count: items.length } }));
    } catch (err) {
      console.error("Erro ao buscar agenda do n8n:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();

    const webhookUrl = localStorage.getItem("nexus_n8n_webhook_url");
    if (!webhookUrl) return;

    if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'delete_appointment', appointmentId: id }),
      });

      if (!response.ok) throw new Error('Falha ao excluir');

      toast.success("Agendamento excluído com sucesso!");
      fetchAppointments(); // Refresh list
    } catch (err) {
      toast.error("Ocorreu um erro ao excluir o agendamento.");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAppointments();

    const handleUpdate = () => fetchAppointments();
    window.addEventListener("n8n_url_updated", handleUpdate);
    return () => window.removeEventListener("n8n_url_updated", handleUpdate);
  }, []);

  if (loading && appointments.length === 0) {
    return (
      <div className="glass rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Sincronizando com n8n...</p>
      </div>
    );
  }

  if (error || !localStorage.getItem("nexus_n8n_webhook_url")) {
    const url = localStorage.getItem("nexus_n8n_webhook_url") || "";
    const isTestUrl = url.includes("/webhook-test/");

    return (
      <div className="glass rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px] space-y-4 text-center">
        <AlertCircle className="w-10 h-10 text-warning" />
        <div>
          <h3 className="font-display font-semibold text-foreground">Atenção!</h3>
          <p className="text-sm text-muted-foreground mt-1 px-4">
            {!url
              ? "Configuração Necessária: Vá em Integrações e configure sua URL do n8n para ver a agenda real."
              : isTestUrl
                ? "Você está usando uma URL de TESTE. Certifique-se de que o workflow no n8n esteja em modo 'Executar' ou use a URL de PRODUÇÃO."
                : "Não conseguimos conectar à sua URL do n8n. Verifique se o workflow está ativo e se a URL está correta."}
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          className="text-xs font-bold uppercase text-primary hover:underline flex items-center gap-2"
        >
          <RefreshCw className="w-3 h-3" />
          Tentar Novamente
        </button>
      </div>
    );
  }

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
          <p className="text-sm text-muted-foreground">{appointments.length} agendamentos sincronizados</p>
        </div>
        <button
          onClick={fetchAppointments}
          className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-primary"
          title="Sincronizar agora"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {appointments.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">Nenhuma consulta agendada para hoje.</p>
          </div>
        ) : (
          appointments.map((apt, i) => (
            <motion.div
              key={apt.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
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
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyles[apt.status] || "bg-muted text-muted-foreground"}`}>
                  {statusLabels[apt.status] || "Pendente"}
                </span>
                <button
                  onClick={(e) => handleDelete(e, apt.id)}
                  className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-all"
                  title="Excluir agendamento"
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
