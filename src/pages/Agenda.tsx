import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw, Clock3, Stethoscope, UserRound, Pencil, Trash2, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = toLocalDateInputValue(selectedDate);

  // Modal states
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formPatient, setFormPatient] = useState("");
  const [formDoctor, setFormDoctor] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formStatus, setFormStatus] = useState("pendente");
  const [formNotes, setFormNotes] = useState("");

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
      if (error) { if (import.meta.env.DEV) console.warn("agendamentos:", error.message); return []; }
      return (data || []) as AppointmentItem[];
    },
  });

  const openEdit = (appt: AppointmentItem) => {
    setSelectedAppointment(appt);
    setFormPatient(appt.patient_name);
    setFormDoctor(appt.doctor_name || "");
    setFormTime(appt.time || "");
    setFormStatus(appt.status);
    setFormNotes(appt.notes || "");
    setEditOpen(true);
  };

  const openAdd = () => {
    setFormPatient("");
    setFormDoctor("");
    setFormTime("");
    setFormStatus("pendente");
    setFormNotes("");
    setAddOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedAppointment) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("agendamentos")
        .update({
          patient_name: formPatient,
          doctor_name: formDoctor || null,
          time: formTime || null,
          status: formStatus,
          notes: formNotes || null,
        })
        .eq("id", selectedAppointment.id);
      if (error) throw error;
      toast.success("Agendamento atualizado!");
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
    } catch (err: any) {
      if (import.meta.env.DEV) console.error(err);
      toast.error("Erro ao atualizar agendamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAppointment) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("agendamentos")
        .delete()
        .eq("id", selectedAppointment.id);
      if (error) throw error;
      toast.success("Agendamento excluído!");
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
    } catch (err: any) {
      if (import.meta.env.DEV) console.error(err);
      toast.error("Erro ao excluir agendamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdd = async () => {
    if (!organizationId || !formPatient) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("agendamentos")
        .insert([{
          organization_id: organizationId,
          patient_name: formPatient,
          doctor_name: formDoctor || null,
          time: formTime || null,
          date: dateStr,
          status: formStatus,
          notes: formNotes || null,
          source: "manual",
        }]);
      if (error) throw error;
      toast.success("Agendamento criado!");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
    } catch (err: any) {
      if (import.meta.env.DEV) console.error(err);
      toast.error("Erro ao criar agendamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

  const formatDateBR = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

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

  const AppointmentForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Paciente *</Label>
        <Input value={formPatient} onChange={(e) => setFormPatient(e.target.value)} placeholder="Nome do paciente" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Médico(a)</Label>
          <Input value={formDoctor} onChange={(e) => setFormDoctor(e.target.value)} placeholder="Dr(a)." />
        </div>
        <div className="space-y-2">
          <Label>Horário</Label>
          <Input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={formStatus} onValueChange={setFormStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Observações opcionais" />
      </div>
      <DialogFooter className="pt-2">
        <Button onClick={onSubmit} disabled={isSubmitting || !formPatient} className="w-full gradient-primary">
          {isSubmitting ? "Salvando..." : submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );

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
                <p className="text-sm text-muted-foreground">Visão diária rápida para recepção.</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <button onClick={() => changeDay(-1)} className="hover:text-primary transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <span className="font-medium text-foreground capitalize">{formatDateBR(selectedDate)}</span>
                <button onClick={() => changeDay(1)} className="hover:text-primary transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={openAdd} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" /> Novo Agendamento
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass rounded-2xl p-4 border border-border/40">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total do dia</p>
            <p className="text-2xl font-display font-bold text-foreground mt-2">{items.length}</p>
          </div>
          <div className="glass rounded-2xl p-4 border border-border/40">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Confirmados</p>
            <p className="text-2xl font-display font-bold text-success mt-2">{confirmedCount}</p>
          </div>
          <div className="glass rounded-2xl p-4 border border-border/40">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-display font-bold text-warning mt-2">{pendingCount}</p>
          </div>
          <div className="glass rounded-2xl p-4 border border-border/40">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Atualização</p>
            <p className="text-sm font-semibold text-foreground mt-2">A cada 30s</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="glass rounded-[28px] p-4 md:p-6 card-shadow border border-border/40">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-24 animate-pulse bg-muted/20 rounded-2xl" />)}
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Erro ao carregar agendamentos.</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4"><RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente</Button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum agendamento para esta data.</p>
              <Button onClick={openAdd} variant="outline" className="mt-4"><Plus className="w-4 h-4 mr-2" /> Adicionar Agendamento</Button>
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
                      <div className="rounded-2xl border border-dashed border-border/40 p-5 text-sm text-muted-foreground">Horário livre</div>
                    ) : (
                      appointments.map((appointment, index) => (
                        <motion.div
                          key={appointment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="rounded-2xl border border-border/40 bg-background/70 p-4 md:p-5 hover:border-primary/30 transition-colors group"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-3 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className={cn("text-[10px] border", statusStyles[appointment.status] || statusStyles.pendente)}>
                                  {statusLabels[appointment.status] || appointment.status || "Pendente"}
                                </Badge>
                                {appointment.source && (
                                  <span className="text-[11px] font-medium text-primary capitalize">via {appointment.source.split("_").join(" ")}</span>
                                )}
                              </div>
                              <div>
                                <p className="text-lg font-display font-bold text-foreground">{appointment.patient_name}</p>
                                <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:flex-wrap md:items-center md:gap-4">
                                  <span className="inline-flex items-center gap-2"><UserRound className="w-4 h-4" /> Paciente</span>
                                  {appointment.doctor_name && <span className="inline-flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Dr(a). {appointment.doctor_name}</span>}
                                  <span className="inline-flex items-center gap-2"><Clock3 className="w-4 h-4" /> {appointment.time || "Sem horário"}</span>
                                </div>
                              </div>
                              {appointment.notes && <p className="text-sm text-muted-foreground leading-relaxed">{appointment.notes}</p>}
                            </div>
                            {/* Action buttons */}
                            <div className="flex gap-2 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => openEdit(appointment)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => { setSelectedAppointment(appointment); setDeleteOpen(true); }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
            <DialogDescription>Altere os dados e salve.</DialogDescription>
          </DialogHeader>
          <AppointmentForm onSubmit={handleSaveEdit} submitLabel="Salvar Alterações" />
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>Preencha os dados do agendamento para {formatDateBR(selectedDate)}.</DialogDescription>
          </DialogHeader>
          <AppointmentForm onSubmit={handleAdd} submitLabel="Criar Agendamento" />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o agendamento de <strong>{selectedAppointment?.patient_name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSubmitting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Agenda;
