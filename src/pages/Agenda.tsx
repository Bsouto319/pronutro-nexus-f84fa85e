import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw, Clock3, Stethoscope, UserRound, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

type AppointmentItem = {
  id: string;
  paciente_nome: string | null;
  paciente_telefone: string | null;
  doctor_name: string | null;
  data_inicio: string | null;
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

const toLocalDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMonthRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    from: toLocalDateInputValue(start),
    to: toLocalDateInputValue(end),
  };
};

const formatDateBR = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

// Normalize PostgreSQL timestamptz format to valid ISO 8601 for reliable parsing.
// PostgreSQL may return "2026-04-14 20:00:00+00" (space, short offset).
// JS requires "2026-04-14T20:00:00+00:00" (T separator, full offset).
const normalizeTimestamp = (utcStr: string): string =>
  utcStr
    .replace(" ", "T")                       // space → T
    .replace(/([+-]\d{2})$/, "$1:00");       // +00 → +00:00

// Convert UTC timestamp to BRT (UTC-3) date string "YYYY-MM-DD"
const utcToBRTDate = (utcStr: string): string => {
  const d = new Date(normalizeTimestamp(utcStr));
  if (isNaN(d.getTime())) return "";
  const brtMs = d.getTime() - 3 * 60 * 60 * 1000;
  const brt = new Date(brtMs);
  return `${brt.getUTCFullYear()}-${String(brt.getUTCMonth() + 1).padStart(2, "0")}-${String(brt.getUTCDate()).padStart(2, "0")}`;
};

// Convert UTC timestamp to BRT time string "HH:mm"
const utcToBRTTime = (utcStr: string): string => {
  const d = new Date(normalizeTimestamp(utcStr));
  if (isNaN(d.getTime())) return "Sem horário";
  const brtMs = d.getTime() - 3 * 60 * 60 * 1000;
  const brt = new Date(brtMs);
  return `${String(brt.getUTCHours()).padStart(2, "0")}:${String(brt.getUTCMinutes()).padStart(2, "0")}`;
};

const Agenda = () => {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visibleMonth, setVisibleMonth] = useState(new Date());

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formPatient, setFormPatient] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formDoctor, setFormDoctor] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formStatus, setFormStatus] = useState("pendente");
  const [formNotes, setFormNotes] = useState("");

  const dateStr = toLocalDateInputValue(selectedDate);
  const monthRange = useMemo(() => getMonthRange(visibleMonth), [visibleMonth]);

  const { data: agendamentos = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["agendamentos", organizationId, monthRange.from, monthRange.to],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // BRT = UTC-3: first day of month in BRT starts at 03:00 UTC of that day
      // Last day ends at 02:59:59 UTC of the next day
      const fromUTC = `${monthRange.from}T03:00:00+00:00`;
      // Add 1 day to end of month for the UTC cutoff
      const endDate = new Date(`${monthRange.to}T12:00:00`);
      endDate.setDate(endDate.getDate() + 1);
      const toUTC = `${toLocalDateInputValue(endDate)}T02:59:59+00:00`;

      let query = supabase
        .from("agendamentos")
        .select("id, paciente_nome, paciente_telefone, doctor_name, data_inicio, status, source, notes");

      if (organizationId) {
        query = query.eq("organization_id", organizationId);
      }

      const { data, error } = await query
        .gte("data_inicio", fromUTC)
        .lte("data_inicio", toUTC)
        .order("data_inicio", { ascending: true });

      if (error) {
        console.error("agendamentos query error:", error.message);
        throw new Error(error.message);
      }

      return (data || []) as AppointmentItem[];
    },
  });

  // Bug 1 + Bug 2: filter by BRT date extracted from data_inicio
  const dayAppointments = useMemo(
    () => agendamentos.filter((item) => {
      if (!item.data_inicio) return false;
      return utcToBRTDate(item.data_inicio) === dateStr;
    }),
    [agendamentos, dateStr],
  );

  const bookedDays = useMemo(
    () => [...new Set(
      agendamentos
        .filter(item => item.data_inicio)
        .map(item => utcToBRTDate(item.data_inicio!))
    )].map(date => new Date(`${date}T12:00:00`)),
    [agendamentos],
  );

  const confirmedCount = dayAppointments.filter((item) => item.status === "confirmado").length;
  const pendingCount = dayAppointments.filter((item) => item.status === "pendente").length;

  const openEdit = (appt: AppointmentItem) => {
    setSelectedAppointment(appt);
    setFormPatient(appt.paciente_nome || "");
    setFormPhone(appt.paciente_telefone || "");
    setFormDoctor(appt.doctor_name || "");
    setFormTime(appt.data_inicio ? utcToBRTTime(appt.data_inicio) : "");
    setFormStatus(appt.status);
    setFormNotes(appt.notes || "");
    const brtDate = appt.data_inicio ? utcToBRTDate(appt.data_inicio) : toLocalDateInputValue(new Date());
    setSelectedDate(new Date(`${brtDate}T12:00:00`));
    setEditOpen(true);
  };

  const openAdd = () => {
    setSelectedAppointment(null);
    setFormPatient("");
    setFormPhone("");
    setFormDoctor("");
    setFormTime("");
    setFormStatus("pendente");
    setFormNotes("");
    setAddOpen(true);
  };

  const invalidateAgenda = () => {
    queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
  };

  const handleSaveEdit = async () => {
    if (!selectedAppointment) return;
    setIsSubmitting(true);
    try {
      const dataInicio = formTime
        ? `${dateStr}T${formTime}:00-03:00`
        : `${dateStr}T00:00:00-03:00`;

      const { error } = await supabase
        .from("agendamentos")
        .update({
          paciente_nome: formPatient,
          paciente_telefone: formPhone || null,
          doctor_name: formDoctor || null,
          data_inicio: dataInicio,
          status: formStatus,
          notes: formNotes || null,
        })
        .eq("id", selectedAppointment.id);

      if (error) throw error;
      toast.success("Agendamento atualizado!");
      setEditOpen(false);
      invalidateAgenda();
    } catch {
      toast.error("Erro ao atualizar agendamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAppointment) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("agendamentos").delete().eq("id", selectedAppointment.id);
      if (error) throw error;
      toast.success("Agendamento excluído!");
      setDeleteOpen(false);
      invalidateAgenda();
    } catch {
      toast.error("Erro ao excluir agendamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdd = async () => {
    if (!organizationId || !formPatient) return;
    setIsSubmitting(true);
    try {
      const dataInicio = formTime
        ? `${dateStr}T${formTime}:00-03:00`
        : `${dateStr}T00:00:00-03:00`;

      const { error } = await supabase.from("agendamentos").insert([{
        organization_id: organizationId,
        patient_name: formPatient,
        paciente_nome: formPatient,
        paciente_telefone: formPhone || null,
        doctor_name: formDoctor || null,
        profissional: formDoctor || null,
        data_inicio: dataInicio,
        status: formStatus,
        notes: formNotes || null,
        source: "manual",
      }]);

      if (error) throw error;

      // Bug 3: UPSERT no Kanban para exibir o paciente correto
        // The trigger auto_create_lead_from_agendamento handles lead creation
        // No manual upsert needed here

      toast.success("Agendamento criado!");
      setAddOpen(false);
      invalidateAgenda();
    } catch {
      toast.error("Erro ao criar agendamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeMonth = (delta: number) => {
    const next = new Date(visibleMonth);
    next.setMonth(next.getMonth() + delta);
    setVisibleMonth(next);

    if (selectedDate.getMonth() !== next.getMonth() || selectedDate.getFullYear() !== next.getFullYear()) {
      setSelectedDate(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  };

  const AppointmentForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Paciente *</Label>
        <Input value={formPatient} onChange={(e) => setFormPatient(e.target.value)} placeholder="Nome do paciente" required />
      </div>
      <div className="space-y-2">
        <Label>Telefone</Label>
        <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="(00) 00000-0000" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Médico(a)</Label>
          <Input value={formDoctor} onChange={(e) => setFormDoctor(e.target.value)} placeholder="Dr(a)." />
        </div>
        <div className="space-y-2">
          <Label>Horário (BRT)</Label>
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
      <TopBar title="Agenda Médica" subtitle="Visão mensal completa para acompanhar todo o mês" onRefresh={() => refetch()} />
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-2">
              <div>
                <h2 className="text-3xl font-display font-bold text-foreground">Agenda</h2>
                <p className="text-sm text-muted-foreground">Calendário completo do mês com foco no dia selecionado.</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <button onClick={() => changeMonth(-1)} className="hover:text-primary transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <span className="font-medium text-foreground capitalize">{visibleMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
                <button onClick={() => changeMonth(1)} className="hover:text-primary transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={openAdd} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" /> Novo Agendamento
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl p-4 bg-card border border-border/40 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Selecionado</p>
            <p className="text-lg font-display font-bold text-foreground mt-2 capitalize">{formatDateBR(selectedDate)}</p>
          </div>
          <div className="rounded-2xl p-4 bg-card border border-border/40 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total do dia</p>
            <p className="text-2xl font-display font-bold text-foreground mt-2">{dayAppointments.length}</p>
          </div>
          <div className="rounded-2xl p-4 bg-card border border-border/40 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Confirmados</p>
            <p className="text-2xl font-display font-bold text-success mt-2">{confirmedCount}</p>
          </div>
          <div className="rounded-2xl p-4 bg-card border border-border/40 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-display font-bold text-warning mt-2">{pendingCount}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="rounded-[28px] p-4 md:p-6 bg-card shadow-sm border border-border/40">
            <Calendar
              mode="single"
              month={visibleMonth}
              onMonthChange={setVisibleMonth}
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              modifiers={{ booked: bookedDays }}
              modifiersClassNames={{ booked: "relative after:absolute after:bottom-1.5 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary" }}
              className="w-full rounded-2xl"
              classNames={{
                months: "flex w-full",
                month: "w-full space-y-4",
                table: "w-full border-collapse",
                head_row: "grid grid-cols-7",
                row: "grid grid-cols-7 mt-2",
                head_cell: "h-10 w-full text-center text-xs font-semibold text-muted-foreground",
                cell: "h-14 w-full p-1 text-center",
                day: cn("h-12 w-12 rounded-2xl text-sm font-medium mx-auto text-foreground hover:bg-muted"),
                day_selected: "bg-primary text-primary-foreground hover:bg-primary focus:bg-primary",
                day_today: "bg-accent text-accent-foreground",
              }}
            />
          </div>

          <div className="rounded-[28px] p-4 md:p-6 bg-card shadow-sm border border-border/40 min-h-[420px]">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-24 animate-pulse bg-muted/20 rounded-2xl" />)}
              </div>
            ) : isError ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Erro ao carregar agendamentos.</p>
                <Button variant="outline" onClick={() => refetch()} className="mt-4"><RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente</Button>
              </div>
            ) : dayAppointments.length === 0 ? (
              <div className="text-center py-16">
                <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum agendamento para {formatDateBR(selectedDate)}.</p>
                <Button onClick={openAdd} variant="outline" className="mt-4"><Plus className="w-4 h-4 mr-2" /> Adicionar Agendamento</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {dayAppointments.map((appointment, index) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-2xl border border-border/40 bg-secondary/50 p-4 md:p-5 hover:border-primary/30 transition-colors group"
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
                          {/* Bug 1: usar paciente_nome */}
                          <p className="text-lg font-display font-bold text-foreground">
                            {appointment.paciente_nome || "Paciente não identificado"}
                          </p>
                          <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:flex-wrap md:items-center md:gap-4">
                            <span className="inline-flex items-center gap-2"><UserRound className="w-4 h-4" /> Paciente</span>
                            {appointment.doctor_name && <span className="inline-flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Dr(a). {appointment.doctor_name}</span>}
                            {/* Bug 2: converter data_inicio UTC para BRT */}
                            <span className="inline-flex items-center gap-2">
                              <Clock3 className="w-4 h-4" />
                              {appointment.data_inicio ? utcToBRTTime(appointment.data_inicio) : "Sem horário"}
                            </span>
                          </div>
                        </div>
                        {appointment.notes && <p className="text-sm text-muted-foreground leading-relaxed">{appointment.notes}</p>}
                      </div>
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
            <DialogDescription>Altere os dados e salve.</DialogDescription>
          </DialogHeader>
          <AppointmentForm onSubmit={handleSaveEdit} submitLabel="Salvar Alterações" />
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>Preencha os dados do agendamento para {formatDateBR(selectedDate)}.</DialogDescription>
          </DialogHeader>
          <AppointmentForm onSubmit={handleAdd} submitLabel="Criar Agendamento" />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o agendamento de <strong>{selectedAppointment?.paciente_nome}</strong>? Esta ação não pode ser desfeita.
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
