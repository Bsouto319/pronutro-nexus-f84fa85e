import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { Stethoscope, Plus, User, Award, Pencil, Trash2, Phone, Mail, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { motion } from "framer-motion";
import { EditDoctorDialog } from "@/components/medicos/EditDoctorDialog";
import { DoctorScheduleEditor, DEFAULT_SCHEDULE, WeekSchedule } from "@/components/medicos/DoctorScheduleEditor";
import { loadDraft, saveDraft, clearDraft } from "@/lib/draft";

const colors = [
  "from-primary to-info",
  "from-chart-3 to-primary",
  "from-chart-4 to-chart-5",
  "from-info to-chart-3",
  "from-primary to-chart-2",
  "from-chart-5 to-chart-4",
];

const DRAFT_KEY = "doctor-new";

type DoctorDraft = {
  name: string; specialty: string; crm: string; phone: string; email: string;
  bio: string; commission: string; schedule: WeekSchedule;
};

const EMPTY_DRAFT: DoctorDraft = {
  name: "", specialty: "", crm: "", phone: "", email: "",
  bio: "", commission: "0", schedule: DEFAULT_SCHEDULE,
};

const Medicos = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<DoctorDraft>(EMPTY_DRAFT);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { organizationId } = useOrganization();

  // Carrega rascunho persistido
  useEffect(() => {
    setDraft(loadDraft<DoctorDraft>(DRAFT_KEY, EMPTY_DRAFT));
  }, []);
  // Salva rascunho continuamente
  useEffect(() => { saveDraft(DRAFT_KEY, draft); }, [draft]);

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["clinic_doctors", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_doctors")
        .select("*")
        .eq("organization_id", organizationId!);
      if (error) throw error;
      return data || [];
    },
  });

  const handleAddDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !organizationId) { toast.error("Você precisa estar logado e ter uma organização."); return; }
    if (!draft.name.trim()) { toast.error("Nome é obrigatório."); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("clinic_doctors").insert([{
        name: draft.name.trim(),
        specialty: draft.specialty || null,
        crm: draft.crm || null,
        phone: draft.phone || null,
        email: draft.email || null,
        bio: draft.bio || null,
        commission_percent: parseFloat(draft.commission) || 0,
        schedule: draft.schedule as any,
        organization_id: organizationId,
      }]);
      if (error) throw error;
      toast.success("Médico cadastrado com sucesso!");
      setAddOpen(false);
      clearDraft(DRAFT_KEY);
      setDraft(EMPTY_DRAFT);
      queryClient.invalidateQueries({ queryKey: ["clinic_doctors"] });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao cadastrar médico.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDoctor = async () => {
    if (!selectedDoctor) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("clinic_doctors").delete().eq("id", selectedDoctor.id);
      if (error) throw error;
      toast.success("Médico removido!");
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["clinic_doctors"] });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao remover médico.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const set = <K extends keyof DoctorDraft>(k: K, v: DoctorDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <AppLayout>
      <TopBar title="Corpo Clínico" subtitle="Gerencie os profissionais da clínica" />
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Médicos</h1>
              <p className="text-sm text-muted-foreground">{doctors.length} profissionais cadastrados</p>
            </div>
          </div>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary"><Plus className="w-4 h-4 mr-2" /> Novo Médico</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Profissional</DialogTitle>
                <DialogDescription>Preencha o cadastro completo. O rascunho é salvo automaticamente.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddDoctor} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Nome Completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Dr. João Silva" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Especialidade</Label>
                    <div className="relative">
                      <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={draft.specialty} onChange={(e) => set("specialty", e.target.value)} placeholder="Ex: Nutrologia" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>CRM</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={draft.crm} onChange={(e) => set("crm", e.target.value)} placeholder="CRM/UF 000000" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={draft.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(00) 00000-0000" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={draft.email} onChange={(e) => set("email", e.target.value)} type="email" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Comissão (%)</Label>
                    <Input value={draft.commission} onChange={(e) => set("commission", e.target.value)} type="number" step="0.5" min="0" max="100" />
                  </div>
                  <div className="col-span-2">
                    <DoctorScheduleEditor value={draft.schedule} onChange={(s) => set("schedule", s)} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Bio / Sobre</Label>
                    <Textarea value={draft.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Formação, experiência, cursos..." rows={2} />
                  </div>
                </div>
                <DialogFooter className="pt-2 gap-2">
                  <Button type="button" variant="ghost" onClick={() => { clearDraft(DRAFT_KEY); setDraft(EMPTY_DRAFT); }}>
                    Limpar
                  </Button>
                  <Button type="submit" className="gradient-primary" disabled={isSubmitting}>
                    {isSubmitting ? "Cadastrando..." : "Confirmar Cadastro"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-40 animate-pulse bg-muted/20 rounded-2xl" />)}
          </div>
        ) : doctors.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border border-border/40">
            <Stethoscope className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum médico cadastrado.</p>
            <Button onClick={() => setAddOpen(true)} variant="outline" className="mt-4"><Plus className="w-4 h-4 mr-2" /> Adicionar Médico</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doc: any, i: number) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 + i * 0.04 }}
                className="glass rounded-2xl p-5 border border-border/40 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-primary-foreground font-bold text-sm`}>
                    {doc.name ? doc.name.substring(0, 2).toUpperCase() : "DR"}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedDoctor(doc); setEditOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSelectedDoctor(doc); setDeleteOpen(true); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-base font-display font-bold text-foreground truncate">{doc.name}</p>
                <p className="text-sm text-muted-foreground truncate mt-0.5">{doc.specialty || "Sem especialidade"}</p>
                {doc.crm && <p className="text-xs text-muted-foreground mt-1">CRM: {doc.crm}</p>}
                {doc.schedule && Object.keys(doc.schedule || {}).length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Horários configurados
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
                  <span>{doc.patients_count || 0} pacientes</span>
                  <span>R$ {(doc.revenue || 0).toLocaleString("pt-BR")}</span>
                  {doc.commission_percent > 0 && <span>{doc.commission_percent}% comissão</span>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <EditDoctorDialog open={editOpen} onOpenChange={setEditOpen} doctor={selectedDoctor} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Médico</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja remover <strong>{selectedDoctor?.name}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDoctor} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSubmitting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Medicos;
