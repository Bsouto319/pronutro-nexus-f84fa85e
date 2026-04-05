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
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { motion } from "framer-motion";
import { EditDoctorDialog } from "@/components/medicos/EditDoctorDialog";

const colors = [
  "from-primary to-info",
  "from-chart-3 to-primary",
  "from-chart-4 to-chart-5",
  "from-info to-chart-3",
  "from-primary to-chart-2",
  "from-chart-5 to-chart-4",
];

const Medicos = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { organizationId } = useOrganization();

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
    if (!user || !organizationId) { toast.error("Você precisa estar logado."); return; }
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const { error } = await supabase.from("clinic_doctors").insert([{
        name: fd.get("name") as string,
        specialty: fd.get("specialty") as string || null,
        crm: fd.get("crm") as string || null,
        phone: fd.get("phone") as string || null,
        email: fd.get("email") as string || null,
        bio: fd.get("bio") as string || null,
        working_days: fd.get("working_days") as string || null,
        working_hours: fd.get("working_hours") as string || null,
        commission_percent: parseFloat(fd.get("commission") as string || "0"),
        organization_id: organizationId,
      }]);
      if (error) throw error;
      toast.success("Médico cadastrado com sucesso!");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["clinic_doctors"] });
    } catch {
      toast.error("Erro ao cadastrar médico.");
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
    } catch {
      toast.error("Erro ao remover médico.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Profissional</DialogTitle>
                <DialogDescription>Preencha o cadastro completo do médico.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddDoctor} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="name" name="name" placeholder="Ex: Dr. João Silva" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Especialidade</Label>
                    <div className="relative">
                      <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input name="specialty" placeholder="Ex: Nutrologia" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>CRM</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input name="crm" placeholder="CRM/UF 000000" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input name="phone" placeholder="(00) 00000-0000" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input name="email" type="email" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dias de Trabalho</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input name="working_days" placeholder="Seg, Ter, Qua..." className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input name="working_hours" placeholder="08:00 - 18:00" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Comissão (%)</Label>
                    <Input name="commission" type="number" step="0.5" min="0" max="100" defaultValue="0" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Bio / Sobre</Label>
                    <Textarea name="bio" placeholder="Formação, experiência, cursos..." rows={2} />
                  </div>
                </div>
                <DialogFooter className="pt-2">
                  <Button type="submit" className="w-full gradient-primary" disabled={isSubmitting}>
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
                {doc.working_days && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {doc.working_days} {doc.working_hours && `• ${doc.working_hours}`}
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
