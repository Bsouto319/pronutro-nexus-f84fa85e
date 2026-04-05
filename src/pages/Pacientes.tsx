import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { Users, Search, Plus, Filter, Trash2, User, Phone, CreditCard, Mail, Calendar, FileText, UserCheck, Pencil, Gift } from "lucide-react";
import { useFinanceData } from "@/hooks/useFinanceData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PatientHistoryPanel } from "@/components/pacientes/PatientHistoryPanel";
import { EditPatientDialog } from "@/components/pacientes/EditPatientDialog";
import { FollowUpPanel } from "@/components/pacientes/FollowUpPanel";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Pacientes = () => {
  const { patients, doctors, isLoading } = useFinanceData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<typeof patients[0] | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDoctorName = (doctorId: string | null) => {
    if (!doctorId) return "Não atribuído";
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : "Não encontrado";
  };

  const handleAddPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) { toast.error("Você precisa estar logado."); return; }
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const { data: orgMember } = await supabase
        .from("organization_members").select("organization_id").eq("user_id", user.id).single();
      if (!orgMember) throw new Error("Usuário não possui organização.");

      const { error } = await supabase.from("clinic_patients").insert([{
        name: formData.get("name") as string,
        phone: (formData.get("phone") as string) || null,
        email: (formData.get("email") as string) || null,
        cpf: (formData.get("cpf") as string) || null,
        birth_date: (formData.get("birthDate") as string) || null,
        referral: (formData.get("referral") as string) || null,
        payment_method: formData.get("payment") as string,
        doctor_id: (formData.get("doctorId") as string) || null,
        organization_id: orgMember.organization_id,
      }]);
      if (error) throw error;
      toast.success("Paciente cadastrado com sucesso!");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["clinic_patients"] });
    } catch {
      toast.error("Erro ao cadastrar paciente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir os dados deste paciente?")) return;
    try {
      const { error } = await supabase.from("clinic_patients").delete().eq("id", id);
      if (error) throw error;
      toast.success("Paciente removido.");
      queryClient.invalidateQueries({ queryKey: ["clinic_patients"] });
    } catch {
      toast.error("Erro ao remover paciente.");
    }
  };

  return (
    <AppLayout>
      <TopBar title="Gestão de Pacientes" subtitle="Base de dados completa da clínica" />
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        <Tabs defaultValue="pacientes">
          <TabsList>
            <TabsTrigger value="pacientes"><Users className="w-4 h-4 mr-1" /> Pacientes</TabsTrigger>
            <TabsTrigger value="followup"><Gift className="w-4 h-4 mr-1" /> Follow-up</TabsTrigger>
          </TabsList>

          <TabsContent value="pacientes" className="space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold text-foreground">Pacientes</h1>
                  <p className="text-sm text-muted-foreground">{patients.length} pacientes cadastrados</p>
                </div>
              </div>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary"><Plus className="w-4 h-4 mr-2" /> Novo Paciente</Button>
                </DialogTrigger>
                <DialogContent className="glass border-primary/20 sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-display font-bold">Cadastrar Novo Paciente</DialogTitle>
                    <DialogDescription>Preencha os dados do paciente.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddPatient} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="name" name="name" placeholder="Nome do paciente" className="pl-10 glass" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone / WhatsApp</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input name="phone" placeholder="(00) 00000-0000" className="pl-10 glass" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>E-mail</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input name="email" type="email" placeholder="email@exemplo.com" className="pl-10 glass" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>CPF</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input name="cpf" placeholder="000.000.000-00" className="pl-10 glass" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Data de Nascimento</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input name="birthDate" type="date" className="pl-10 glass" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Indicação</Label>
                        <div className="relative">
                          <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input name="referral" placeholder="Quem indicou?" className="pl-10 glass" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Método de Pagamento</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                          <Select name="payment" defaultValue="Pix">
                            <SelectTrigger className="pl-10 glass"><SelectValue /></SelectTrigger>
                            <SelectContent className="glass">
                              <SelectItem value="Pix">Pix</SelectItem>
                              <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                              <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                              <SelectItem value="Convênio">Convênio</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Médico Responsável</Label>
                        <Select name="doctorId">
                          <SelectTrigger className="glass"><SelectValue placeholder="Selecione um médico" /></SelectTrigger>
                          <SelectContent className="glass">
                            {doctors.map(doc => <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter className="pt-4">
                      <Button type="submit" className="w-full gradient-primary" disabled={isSubmitting}>
                        {isSubmitting ? "Cadastrando..." : "Confirmar Cadastro"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome..." className="pl-10 glass" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>

            <div className="glass rounded-xl overflow-hidden border border-border/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50">
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paciente</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefone</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Médico</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pgto</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {isLoading ? (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
                    ) : filteredPatients.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum paciente encontrado.</td></tr>
                    ) : (
                      filteredPatients.map((patient, i) => (
                        <motion.tr key={patient.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }} className="hover:bg-muted/20 transition-colors group">
                          <td className="p-4">
                            <p className="font-medium text-foreground">{patient.name}</p>
                            {(patient as any).email && <p className="text-xs text-muted-foreground">{(patient as any).email}</p>}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground font-mono">{(patient as any).phone || "—"}</td>
                          <td className="p-4 text-sm text-muted-foreground">{getDoctorName(patient.doctor_id)}</td>
                          <td className="p-4 text-sm">
                            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase ring-1 ring-primary/20">
                              {patient.payment_method || "N/A"}
                            </span>
                          </td>
                          <td className="p-4 text-sm font-semibold text-foreground">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patient.total || 0)}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => { setEditPatient(patient); setEditOpen(true); }}
                                className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10" title="Editar">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => { setSelectedPatient(patient); setHistoryOpen(true); }}
                                className="text-primary hover:text-primary/80 transition-colors text-xs font-medium">Prontuário</button>
                              <button onClick={() => handleDeletePatient(patient.id)}
                                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="followup" className="mt-4">
            <FollowUpPanel />
          </TabsContent>
        </Tabs>
      </div>
      <PatientHistoryPanel patient={selectedPatient} doctors={doctors} open={historyOpen} onOpenChange={setHistoryOpen} />
      <EditPatientDialog open={editOpen} onOpenChange={setEditOpen} patient={editPatient} doctors={doctors} />
    </AppLayout>
  );
};

export default Pacientes;
