import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, FileDown, FileText, Pill, DollarSign, Calendar, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useOrganization } from "@/hooks/useOrganization";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface PatientHistoryPanelProps {
  patient: { id: string; name: string; doctor_id: string | null } | null;
  doctors: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Consultation {
  id: string;
  consultation_date: string;
  procedure_name: string | null;
  procedure_value: number;
  payment_method: string | null;
  medications: string | null;
  quantities: string | null;
  notes: string | null;
  doctor_id: string | null;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function PatientHistoryPanel({ patient, doctors, open, onOpenChange }: PatientHistoryPanelProps) {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: consultations = [], isLoading } = useQuery({
    queryKey: ["patient_consultations", patient?.id],
    enabled: !!patient?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_consultations")
        .select("*")
        .eq("patient_id", patient!.id)
        .order("consultation_date", { ascending: false });
      if (error) throw error;
      return (data || []) as Consultation[];
    },
  });

  const totalInvested = consultations.reduce((acc, c) => acc + (c.procedure_value || 0), 0);

  const getDoctorName = (id: string | null) => {
    if (!id) return "—";
    return doctors.find((d) => d.id === id)?.name || "—";
  };

  const handleAddConsultation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!patient || !organizationId) return;
    setIsSubmitting(true);

    const fd = new FormData(e.currentTarget);

    try {
      const { error } = await supabase.from("patient_consultations").insert([{
        organization_id: organizationId,
        patient_id: patient.id,
        doctor_id: (fd.get("doctorId") as string) || patient.doctor_id || null,
        consultation_date: (fd.get("date") as string) || new Date().toISOString().split("T")[0],
        procedure_name: fd.get("procedure") as string || null,
        procedure_value: parseFloat((fd.get("value") as string) || "0"),
        payment_method: fd.get("payment") as string || null,
        medications: fd.get("medications") as string || null,
        quantities: fd.get("quantities") as string || null,
        notes: fd.get("notes") as string || null,
      }]);

      if (error) throw error;

      // Update patient total
      await supabase
        .from("clinic_patients")
        .update({ total: totalInvested + parseFloat((fd.get("value") as string) || "0") })
        .eq("id", patient.id);

      toast.success("Consulta registrada!");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["patient_consultations", patient.id] });
      queryClient.invalidateQueries({ queryKey: ["clinic_patients"] });
    } catch (err: any) {
      if (import.meta.env.DEV) console.error(err);
      toast.error("Erro ao registrar consulta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este registro?")) return;
    try {
      const { error } = await supabase.from("patient_consultations").delete().eq("id", id);
      if (error) throw error;
      toast.success("Registro removido.");
      queryClient.invalidateQueries({ queryKey: ["patient_consultations", patient?.id] });
      queryClient.invalidateQueries({ queryKey: ["clinic_patients"] });
    } catch {
      toast.error("Erro ao remover.");
    }
  };

  const exportCSV = () => {
    if (!consultations.length || !patient) return;
    const header = "Data,Procedimento,Valor,Pagamento,Medicações,Quantidades,Observações,Médico\n";
    const rows = consultations.map((c) =>
      [
        c.consultation_date,
        c.procedure_name || "",
        c.procedure_value,
        c.payment_method || "",
        c.medications || "",
        c.quantities || "",
        (c.notes || "").replace(/\n/g, " "),
        getDoctorName(c.doctor_id),
      ].map(v => `"${v}"`).join(",")
    ).join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico_${patient.name.replace(/\s/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  const exportPDF = () => {
    if (!consultations.length || !patient) return;

    const printContent = `
      <html><head><title>Histórico - ${patient.name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        h2 { font-size: 14px; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f0f0f0; padding: 8px; text-align: left; border-bottom: 2px solid #ddd; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
        .total { margin-top: 20px; font-size: 16px; font-weight: bold; }
        .footer { margin-top: 40px; font-size: 10px; color: #999; }
      </style></head><body>
      <h1>Histórico do Paciente: ${patient.name}</h1>
      <h2>Exportado em ${new Date().toLocaleDateString("pt-BR")}</h2>
      <table>
        <thead><tr><th>Data</th><th>Procedimento</th><th>Valor</th><th>Pagamento</th><th>Medicações</th><th>Qtd</th><th>Médico</th></tr></thead>
        <tbody>
          ${consultations.map(c => `<tr>
            <td>${new Date(c.consultation_date + "T12:00:00").toLocaleDateString("pt-BR")}</td>
            <td>${c.procedure_name || "—"}</td>
            <td>${formatCurrency(c.procedure_value)}</td>
            <td>${c.payment_method || "—"}</td>
            <td>${c.medications || "—"}</td>
            <td>${c.quantities || "—"}</td>
            <td>${getDoctorName(c.doctor_id)}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      <p class="total">Total Investido: ${formatCurrency(totalInvested)}</p>
      <p class="footer">Documento gerado automaticamente pelo sistema de gestão clínica.</p>
      </body></html>
    `;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(printContent);
      w.document.close();
      w.print();
    }
    toast.success("PDF gerado para impressão!");
  };

  if (!patient) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto bg-background border-border">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-display font-bold text-foreground">{patient.name}</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Total investido: <span className="text-primary font-semibold">{formatCurrency(totalInvested)}</span>
            </p>
          </SheetHeader>

          <div className="flex gap-2 mb-4 flex-wrap">
            <Button size="sm" className="gradient-primary" onClick={() => setAddOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Nova Consulta
            </Button>
            <Button size="sm" variant="outline" onClick={exportPDF} disabled={!consultations.length}>
              <FileText className="w-3.5 h-3.5 mr-1" /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={exportCSV} disabled={!consultations.length}>
              <FileDown className="w-3.5 h-3.5 mr-1" /> CSV
            </Button>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Carregando histórico...</p>
            ) : consultations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma consulta registrada.</p>
            ) : (
              consultations.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-lg p-4 border border-border/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {new Date(c.consultation_date + "T12:00:00").toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">{formatCurrency(c.procedure_value)}</span>
                      <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {c.procedure_name && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-accent" />
                      <span className="text-sm text-foreground">{c.procedure_name}</span>
                      {c.payment_method && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 uppercase font-bold">
                          {c.payment_method}
                        </span>
                      )}
                    </div>
                  )}

                  {c.medications && (
                    <div className="flex items-start gap-2">
                      <Pill className="w-3.5 h-3.5 text-accent mt-0.5" />
                      <span className="text-sm text-muted-foreground">
                        {c.medications}{c.quantities ? ` — ${c.quantities}` : ""}
                      </span>
                    </div>
                  )}

                  {c.notes && (
                    <p className="text-xs text-muted-foreground italic pl-5">{c.notes}</p>
                  )}

                  <p className="text-xs text-muted-foreground pl-5">Médico: {getDoctorName(c.doctor_id)}</p>
                </motion.div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="glass border-primary/20 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">Registrar Consulta</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddConsultation} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Data</Label>
                <Input type="date" name="date" defaultValue={new Date().toISOString().split("T")[0]} className="glass" required />
              </div>
              <div className="space-y-1">
                <Label>Valor (R$)</Label>
                <Input type="number" name="value" step="0.01" min="0" placeholder="0,00" className="glass" required />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Procedimento</Label>
                <Input name="procedure" placeholder="Ex: Limpeza de pele, Botox..." className="glass" />
              </div>
              <div className="space-y-1">
                <Label>Pagamento</Label>
                <Select name="payment" defaultValue="Pix">
                  <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="Pix">Pix</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Convênio">Convênio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Médico</Label>
                <Select name="doctorId" defaultValue={patient.doctor_id || undefined}>
                  <SelectTrigger className="glass"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="glass">
                    {doctors.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Medicações</Label>
                <Input name="medications" placeholder="Ex: Ácido hialurônico, Toxina botulínica..." className="glass" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Quantidades</Label>
                <Input name="quantities" placeholder="Ex: 2 ampolas, 50 unidades..." className="glass" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Observações</Label>
                <Textarea name="notes" placeholder="Notas da consulta..." className="glass" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full gradient-primary" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Registrar Consulta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
