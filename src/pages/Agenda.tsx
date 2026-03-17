import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw, Clock3, Stethoscope, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/hooks/useOrganization";

type AppointmentItem = {
  id: string;
  patient_name: string;
  doctor_name: string | null;
  time: string | null;
  status: string;
  source: string | null;
  notes: string | null;
};

const statusStyles: Record<string, string> = {
  confirmado: "bg-success/15 text-success border-success/30",
  pendente: "bg-warning/15 text-warning border-warning/30",
  cancelado: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusLabels: Record<string, string> = {
  confirmado: "Confirmado",
  pendente: "Pendente",
  cancelado: "Cancelado",
};

const hourSlots = Array.from({ length: 15 }, (_, index) => {
  const hour = index + 7;
  return `${String(hour).padStart(2, "0")}:00`;
});

const toLocalDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getHourKey = (time?: string | null) => {
  if (!time) return "Sem horário";
  const [hour] = time.split(":");
  return `${hour.padStart(2, "0")}:00`;
};

const Agenda = () => {
  const { organizationId } = useOrganization();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = toLocalDateInputValue(selectedDate);

  const { data: agendamentos, isLoading, isError, refetch } = useQuery({
    queryKey: ["agendamentos", dateStr, organizationId],
    enabled: !!organizationId,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("id, patient_name, doctor_name, time, status, source, notes")
        .eq("organization_id", organizationId!)
        .eq("date", dateStr)
        .order("time", { ascending: true });
      if (error) {
        console.warn("agendamentos:", error.message);
        return [];
      }
      return (data || []) as AppointmentItem[];
    },
  });

  const changeDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

  const formatDateBR = (d: Date) => {
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  };

  const items = (agendamentos || []) as AppointmentItem[];

  const groupedAppointments = useMemo(() => {
    const groups = new Map<string, AppointmentItem[]>();

    hourSlots.forEach((slot) => groups.set(slot, []));
    if (!groups.has("Sem horário")) groups.set("Sem horário", []);

    items.forEach((appointment) => {
      const key = hourSlots.includes(getHourKey(appointment.time)) ? getHourKey(appointment.time) : "Sem horário";
      groups.set(key, [...(groups.get(key) || []), appointment]);
    });

    return [...groups.entries()].filter(([, appointments]) => appointments.length > 0 || items.length > 0);
  }, [items]);

  const confirmedCount = items.filter((item) => item.status === "confirmado").length;
  const pendingCount = items.filter((item) => item.status === "pendente").length;

  return (
    <AppLayout>
      <TopBar title="Agenda Médica" subtitle="Visualize e gerencie os atendimentos do dia" onRefresh={() => refetch()} />
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-2">
              <div>
                <h2 className="text-3xl font-display font-bold text-foreground">Agenda</h2>
                <p className="text-sm text-muted-foreground">Visão diária rápida para recepção acompanhar tudo de imediato.</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <button onClick={() => changeDay(-1)} className="hover:text-primary transition-colors" aria-label="Dia anterior"><ChevronLeft className="w-4 h-4" /></button>
                <span className="font-medium text-foreground capitalize">{formatDateBR(selectedDate)}</span>
                <button onClick={() => changeDay(1)} className="hover:text-primary transition-colors" aria-label="Próximo dia"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto lg:min-w-[520px]">
            <div className="glass rounded-2xl p-4 border border-border/40">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total do dia</p>
              <p className="text-2xl font-display font-bold text-foreground mt-2">{items.length}</p>
            </div>
            <div className="glass rounded-2xl p-4 border border-border/40">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Confirmados</p>
              <p className="text-2xl font-display font-bold text-foreground mt-2">{confirmedCount}</p>
            </div>
            <div className="glass rounded-2xl p-4 border border-border/40">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-display font-bold text-foreground mt-2">{pendingCount}</p>
            </div>
            <div className="glass rounded-2xl p-4 border border-border/40">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Atualização</p>
              <p className="text-sm font-semibold text-foreground mt-2">A cada 30s</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-[28px] p-4 md:p-6 card-shadow border border-border/40">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-24 animate-pulse bg-muted/20 rounded-2xl" />)}
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Erro ao carregar agendamentos.</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum agendamento para esta data.</p>
              <p className="text-sm text-muted-foreground/80 mt-2">Se você acabou de criar um, ele deve aparecer aqui automaticamente em até 30 segundos.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedAppointments.map(([slot, appointments]) => (
                <div key={slot} className="grid grid-cols-1 lg:grid-cols-[96px_minmax(0,1fr)] gap-3 items-start">
                  <div className="sticky top-0 rounded-2xl border border-border/40 bg-muted/20 px-4 py-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Clock3 className="w-4 h-4" />
                      <span className="font-display font-semibold">{slot}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {appointments.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border/40 p-5 text-sm text-muted-foreground">
                        Horário livre
                      </div>
                    ) : (
                      appointments.map((appointment, index) => (
                        <motion.div
                          key={appointment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="rounded-2xl border border-border/40 bg-background/70 p-4 md:p-5 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-3 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className={cn("text-[10px] border", statusStyles[appointment.status] || statusStyles.pendente)}>
                                  {statusLabels[appointment.status] || appointment.status || "Pendente"}
                                </Badge>
                                {appointment.source && (
                                  <span className="text-[11px] font-medium text-primary capitalize">
                                    via {appointment.source.replaceAll("_", " ")}
                                  </span>
                                )}
                              </div>

                              <div>
                                <p className="text-lg font-display font-bold text-foreground">{appointment.patient_name}</p>
                                <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:flex-wrap md:items-center md:gap-4">
                                  <span className="inline-flex items-center gap-2">
                                    <UserRound className="w-4 h-4" />
                                    Paciente
                                  </span>
                                  {appointment.doctor_name && (
                                    <span className="inline-flex items-center gap-2">
                                      <Stethoscope className="w-4 h-4" />
                                      Dr(a). {appointment.doctor_name}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center gap-2">
                                    <Clock3 className="w-4 h-4" />
                                    {appointment.time || "Sem horário definido"}
                                  </span>
                                </div>
                              </div>

                              {appointment.notes && (
                                <p className="text-sm text-muted-foreground leading-relaxed">{appointment.notes}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Agenda;
