import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { User, Phone, Mail, Award, FileText, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DoctorScheduleEditor, DEFAULT_SCHEDULE, WeekSchedule } from "@/components/medicos/DoctorScheduleEditor";

interface EditDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: any;
}

export function EditDoctorDialog({ open, onOpenChange, doctor }: EditDoctorDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", specialty: "", crm: "", phone: "", email: "",
    bio: "", commission_percent: "0", notes: "",
    schedule: DEFAULT_SCHEDULE as WeekSchedule,
  });

  useEffect(() => {
    if (doctor) {
      setForm({
        name: doctor.name || "",
        specialty: doctor.specialty || "",
        crm: doctor.crm || "",
        phone: doctor.phone || "",
        email: doctor.email || "",
        bio: doctor.bio || "",
        commission_percent: String(doctor.commission_percent || 0),
        notes: doctor.notes || "",
        schedule: (doctor.schedule && Object.keys(doctor.schedule).length > 0)
          ? doctor.schedule
          : DEFAULT_SCHEDULE,
      });
    }
  }, [doctor]);

  const handleSave = async () => {
    if (!doctor) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("clinic_doctors").update({
        name: form.name,
        specialty: form.specialty || null,
        crm: form.crm || null,
        phone: form.phone || null,
        email: form.email || null,
        bio: form.bio || null,
        commission_percent: parseFloat(form.commission_percent) || 0,
        notes: form.notes || null,
        schedule: form.schedule as any,
      }).eq("id", doctor.id);

      if (error) throw error;
      toast.success("Médico atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clinic_doctors"] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar médico.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold">Perfil do Médico</DialogTitle>
          <DialogDescription>Cadastro completo do profissional.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="Ex: Nutrologia" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>CRM</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.crm} onChange={e => setForm(f => ({ ...f, crm: e.target.value }))} placeholder="CRM/UF 000000" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(00) 00000-0000" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comissão (%)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.commission_percent} onChange={e => setForm(f => ({ ...f, commission_percent: e.target.value }))} type="number" step="0.5" min="0" max="100" className="pl-10" />
              </div>
            </div>
            <div className="col-span-2">
              <DoctorScheduleEditor value={form.schedule} onChange={(s) => setForm(f => ({ ...f, schedule: s }))} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Bio / Sobre</Label>
              <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Formação, experiência..." rows={2} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Observações Internas</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Anotações sobre o profissional..." rows={2} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="w-full gradient-primary" disabled={isSubmitting || !form.name}>
            {isSubmitting ? "Salvando..." : "Salvar Perfil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
