import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Phone, Mail, FileText, Calendar, UserCheck, CreditCard, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface EditPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: any;
  doctors: any[];
}

export function EditPatientDialog({ open, onOpenChange, patient, doctors }: EditPatientDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    cpf: "",
    birth_date: "",
    referral: "",
    payment_method: "Pix",
    doctor_id: "",
    total: "0",
  });

  useEffect(() => {
    if (patient) {
      setForm({
        name: patient.name || "",
        phone: patient.phone || "",
        email: patient.email || "",
        cpf: patient.cpf || "",
        birth_date: patient.birth_date || "",
        referral: patient.referral || "",
        payment_method: patient.payment_method || "Pix",
        doctor_id: patient.doctor_id || "",
        total: String(patient.total || 0),
      });
    }
  }, [patient]);

  const handleSave = async () => {
    if (!patient) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("clinic_patients")
        .update({
          name: form.name,
          phone: form.phone || null,
          email: form.email || null,
          cpf: form.cpf || null,
          birth_date: form.birth_date || null,
          referral: form.referral || null,
          payment_method: form.payment_method,
          doctor_id: form.doctor_id || null,
          total: parseFloat(form.total) || 0,
        })
        .eq("id", patient.id);

      if (error) throw error;
      toast.success("Paciente atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clinic_patients"] });
      onOpenChange(false);
    } catch (err: any) {
      if (import.meta.env.DEV) console.error(err);
      toast.error("Erro ao atualizar paciente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-primary/20 sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold">Editar Paciente</DialogTitle>
          <DialogDescription>Atualize os dados do paciente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="pl-10 glass" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Telefone / WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(00) 00000-0000" className="pl-10 glass" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" className="pl-10 glass" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" className="pl-10 glass" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data de Nascimento</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.birth_date} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} type="date" className="pl-10 glass" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Indicação</Label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.referral} onChange={e => setForm(f => ({ ...f, referral: e.target.value }))} placeholder="Quem indicou?" className="pl-10 glass" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger className="pl-10 glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="Pix">Pix</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Convênio">Convênio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Total Pago (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.total} onChange={e => setForm(f => ({ ...f, total: e.target.value }))} type="number" step="0.01" min="0" className="pl-10 glass" />
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Médico Responsável</Label>
              <Select value={form.doctor_id} onValueChange={v => setForm(f => ({ ...f, doctor_id: v }))}>
                <SelectTrigger className="glass">
                  <SelectValue placeholder="Selecione um médico" />
                </SelectTrigger>
                <SelectContent className="glass">
                  {doctors.map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="w-full gradient-primary" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
