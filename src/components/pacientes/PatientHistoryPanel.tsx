import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, FileDown, FileText, Pill, DollarSign, Calendar, Trash2, Send, Receipt, AlertTriangle, Stethoscope, History, Save } from "lucide-react";
import { motion } from "framer-motion";
import { useOrganization } from "@/hooks/useOrganization";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PatientHistoryPanelProps {
  patient: any | null;
  doctors: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ClinicalData {
  diagnostics: string;
  hpp: string;
  current_medications: string;
  allergies: string;
  important_notes: string;
}
const EMPTY_CLINICAL: ClinicalData = {
  diagnostics: "", hpp: "", current_medications: "", allergies: "", important_notes: "",
};

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
  const [preNotes, setPreNotes] = useState("");
  const [clinical, setClinical] = useState<ClinicalData>(EMPTY_CLINICAL);
  const [savingClinical, setSavingClinical] = useState(false);

  // Hidrata dados clínicos sempre que troca de paciente / abre o painel
  useEffect(() => {
    if (patient && open) {
      setPreNotes(patient.pre_notes || "");
      setClinical({
        diagnostics: patient.diagnostics || "",
        hpp: patient.hpp || "",
        current_medications: patient.current_medications || "",
        allergies: patient.allergies || "",
        important_notes: patient.important_notes || "",
      });
    }
  }, [patient?.id, open]);

  const saveClinical = async () => {
    if (!patient) return;
    setSavingClinical(true);
    const { error } = await supabase.from("clinic_patients").update(clinical).eq("id", patient.id);
    setSavingClinical(false);
    if (error) { toast.error("Erro ao salvar dados clínicos."); return; }
    queryClient.invalidateQueries({ queryKey: ["clinic_patients"] });
    queryClient.invalidateQueries({ queryKey: ["patient_summary", patient.id] });
    toast.success("Dados clínicos salvos!");
  };

  const setC = <K extends keyof ClinicalData>(k: K, v: string) =>
    setClinical((c) => ({ ...c, [k]: v }));

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
      if (patient && (patient as any).pre_notes) setPreNotes((patient as any).pre_notes || "");
      return (data || []) as Consultation[];
    },
  });

  const totalInvested = consultations.reduce((acc, c) => acc + (c.procedure_value || 0), 0);
  const getDoctorName = (id: string | null) => id ? (doctors.find(d => d.id === id)?.name || "—") : "—";

  const handleAddConsultation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!patient || !organizationId) return;
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const value = parseFloat((fd.get("value") as string) || "0");
    const date = (fd.get("date") as string) || new Date().toISOString().split("T")[0];
    const procedure = (fd.get("procedure") as string) || null;
    const payment = (fd.get("payment") as string) || null;
    const doctorId = (fd.get("doctorId") as string) || patient.doctor_id || null;
    const doctorName = doctorId ? (doctors.find(d => d.id === doctorId)?.name || null) : null;

    try {
      const { error } = await supabase.from("patient_consultations").insert([{
        organization_id: organizationId,
        patient_id: patient.id,
        doctor_id: doctorId,
        consultation_date: date,
        procedure_name: procedure,
        procedure_value: value,
        payment_method: payment,
        medications: (fd.get("medications") as string) || null,
        quantities: (fd.get("quantities") as string) || null,
        notes: (fd.get("notes") as string) || null,
      }]);
      if (error) throw error;

      await supabase.from("clinic_patients")
        .update({ total: totalInvested + value })
        .eq("id", patient.id);

      // 💰 Lança automaticamente no Financeiro como entrada
      if (value > 0) {
        const { error: txErr } = await supabase.from("financial_transactions").insert([{
          organization_id: organizationId,
          type: "entrada",
          date,
          payment_date: date,
          description: `Consulta — ${procedure || "Atendimento"} (${patient.name})`,
          patient: patient.name,
          doctor: doctorName,
          payment_method: payment,
          category: "consulta",
          value_in: value,
          value_out: 0,
        }]);
        if (txErr && import.meta.env.DEV) console.warn("Erro ao lançar no financeiro:", txErr.message);
      }

      toast.success("Consulta registrada e lançada no Financeiro!");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["patient_consultations", patient.id] });
      queryClient.invalidateQueries({ queryKey: ["clinic_patients"] });
      queryClient.invalidateQueries({ queryKey: ["financial_transactions"] });
    } catch {
      toast.error("Erro ao registrar consulta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este registro?")) return;
    try {
      await supabase.from("patient_consultations").delete().eq("id", id);
      toast.success("Registro removido.");
      queryClient.invalidateQueries({ queryKey: ["patient_consultations", patient?.id] });
      queryClient.invalidateQueries({ queryKey: ["clinic_patients"] });
    } catch { toast.error("Erro ao remover."); }
  };

  const savePreNotes = async () => {
    if (!patient) return;
    await supabase.from("clinic_patients").update({ pre_notes: preNotes }).eq("id", patient.id);
    queryClient.invalidateQueries({ queryKey: ["clinic_patients"] });
    toast.success("Anotações salvas!");
  };

  const exportCSV = () => {
    if (!consultations.length || !patient) return;
    const header = "Data,Procedimento,Valor,Pagamento,Medicações,Quantidades,Observações,Médico\n";
    const rows = consultations.map(c =>
      [c.consultation_date, c.procedure_name || "", c.procedure_value, c.payment_method || "",
        c.medications || "", c.quantities || "", (c.notes || "").replace(/\n/g, " "), getDoctorName(c.doctor_id)]
        .map(v => `"${v}"`).join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `historico_${patient.name.replace(/\s/g, "_")}.csv`;
    a.click();
    toast.success("CSV exportado!");
  };

  const generateReceipt = () => {
    if (!patient) return;
    const html = `<html><head><title>Recibo - ${patient.name}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{font-size:22px;border-bottom:2px solid #8B5CF6;padding-bottom:8px}
    .info{margin:20px 0}.info p{margin:4px 0;font-size:14px}.table{width:100%;border-collapse:collapse;margin:20px 0;font-size:13px}
    .table th{background:#f5f3ff;padding:10px;text-align:left;border-bottom:2px solid #ddd}.table td{padding:8px;border-bottom:1px solid #eee}
    .total{font-size:18px;font-weight:bold;margin-top:20px;color:#8B5CF6}.footer{margin-top:60px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:12px}
    .sig{margin-top:60px;border-top:1px solid #333;width:250px;text-align:center;padding-top:8px;font-size:12px}</style></head><body>
    <h1>Extrato / Recibo</h1>
    <div class="info"><p><strong>Paciente:</strong> ${patient.name}</p>
    ${(patient as any).cpf ? `<p><strong>CPF:</strong> ${(patient as any).cpf}</p>` : ""}
    ${(patient as any).email ? `<p><strong>E-mail:</strong> ${(patient as any).email}</p>` : ""}
    <p><strong>Data:</strong> ${new Date().toLocaleDateString("pt-BR")}</p></div>
    <table class="table"><thead><tr><th>Data</th><th>Procedimento</th><th>Valor</th><th>Pgto</th><th>Médico</th></tr></thead>
    <tbody>${consultations.map(c => `<tr><td>${new Date(c.consultation_date + "T12:00:00").toLocaleDateString("pt-BR")}</td>
    <td>${c.procedure_name || "—"}</td><td>${formatCurrency(c.procedure_value)}</td>
    <td>${c.payment_method || "—"}</td><td>${getDoctorName(c.doctor_id)}</td></tr>`).join("")}</tbody></table>
    <p class="total">Total: ${formatCurrency(totalInvested)}</p>
    <div class="sig">Assinatura / Carimbo</div>
    <p class="footer">Documento gerado automaticamente. Este recibo não substitui nota fiscal.</p></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
    toast.success("Recibo gerado!");
  };

  const exportProntuario = () => {
    if (!patient) return;
    const html = `<html><head><title>Prontuário - ${patient.name}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{font-size:22px;border-bottom:2px solid #8B5CF6;padding-bottom:8px}
    h2{font-size:16px;color:#8B5CF6;margin-top:30px}.info p{margin:4px 0;font-size:14px}
    .card{border:1px solid #eee;border-radius:8px;padding:16px;margin:12px 0;page-break-inside:avoid}
    .card-header{font-weight:bold;font-size:14px;margin-bottom:8px}.detail{font-size:13px;margin:4px 0;color:#555}
    .footer{margin-top:40px;font-size:10px;color:#999}</style></head><body>
    <h1>Prontuário Médico</h1>
    <div class="info"><p><strong>Paciente:</strong> ${patient.name}</p>
    ${(patient as any).cpf ? `<p><strong>CPF:</strong> ${(patient as any).cpf}</p>` : ""}
    ${(patient as any).birth_date ? `<p><strong>Nascimento:</strong> ${new Date((patient as any).birth_date + "T12:00:00").toLocaleDateString("pt-BR")}</p>` : ""}
    <p><strong>Exportado em:</strong> ${new Date().toLocaleDateString("pt-BR")}</p></div>
    ${preNotes ? `<h2>Anotações Prévias</h2><div class="card"><p class="detail">${preNotes.replace(/\n/g, "<br>")}</p></div>` : ""}
    <h2>Histórico de Consultas (${consultations.length})</h2>
    ${consultations.map(c => `<div class="card">
    <p class="card-header">${new Date(c.consultation_date + "T12:00:00").toLocaleDateString("pt-BR")} — ${c.procedure_name || "Consulta"}</p>
    <p class="detail"><strong>Valor:</strong> ${formatCurrency(c.procedure_value)} | <strong>Pgto:</strong> ${c.payment_method || "—"}</p>
    <p class="detail"><strong>Médico:</strong> ${getDoctorName(c.doctor_id)}</p>
    ${c.medications ? `<p class="detail"><strong>Medicações:</strong> ${c.medications}${c.quantities ? ` (${c.quantities})` : ""}</p>` : ""}
    ${c.notes ? `<p class="detail"><strong>Obs:</strong> ${c.notes}</p>` : ""}
    </div>`).join("")}
    <p class="detail" style="margin-top:20px;font-weight:bold">Total investido: ${formatCurrency(totalInvested)}</p>
    <p class="footer">Documento confidencial. Prontuário gerado pelo sistema de gestão clínica.</p></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
    toast.success("Prontuário exportado!");
  };

  const sendViaWhatsApp = (type: string) => {
    if (!patient) return;
    const phone = ((patient as any).phone || "").replace(/\D/g, "");
    if (!phone) { toast.error("Paciente sem telefone cadastrado."); return; }
    const num = phone.startsWith("55") ? phone : `55${phone}`;
    const msg = type === "recibo"
      ? `Olá ${patient.name.split(" ")[0]}! Segue seu recibo/extrato da clínica. Total: ${formatCurrency(totalInvested)}. Qualquer dúvida estamos à disposição! 😊`
      : `Olá ${patient.name.split(" ")[0]}! Segue seu prontuário atualizado. Total de ${consultations.length} consultas registradas. Qualquer dúvida estamos à disposição! 😊`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (!patient) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[650px] overflow-y-auto bg-background border-border">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-xl font-display font-bold text-foreground">{patient.name}</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Total investido: <span className="text-primary font-semibold">{formatCurrency(totalInvested)}</span>
            </p>
          </SheetHeader>

          <Tabs defaultValue="prontuario" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="prontuario" className="flex-1">Prontuário</TabsTrigger>
              <TabsTrigger value="notas" className="flex-1">Pré-Anotações</TabsTrigger>
              <TabsTrigger value="exportar" className="flex-1">Exportar / Enviar</TabsTrigger>
            </TabsList>

            <TabsContent value="prontuario" className="space-y-3 mt-3">
              <Button size="sm" className="gradient-primary" onClick={() => setAddOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Nova Consulta
              </Button>

              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : consultations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma consulta registrada.</p>
              ) : (
                consultations.map((c, i) => (
                  <motion.div key={c.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded-lg p-4 border border-border/50 space-y-2">
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
                        <span className="text-sm text-muted-foreground">{c.medications}{c.quantities ? ` — ${c.quantities}` : ""}</span>
                      </div>
                    )}
                    {c.notes && <p className="text-xs text-muted-foreground italic pl-5">{c.notes}</p>}
                    <p className="text-xs text-muted-foreground pl-5">Médico: {getDoctorName(c.doctor_id)}</p>
                  </motion.div>
                ))
              )}
            </TabsContent>

            <TabsContent value="notas" className="space-y-3 mt-3">
              <p className="text-sm text-muted-foreground">Anotações da recepcionista ou pré-consulta (triagem, queixas iniciais, etc.)</p>
              <Textarea
                value={preNotes}
                onChange={e => setPreNotes(e.target.value)}
                placeholder="Ex: Paciente relata dores no joelho há 3 meses. Traz exames de sangue recentes. Alergia a dipirona..."
                rows={8}
              />
              <Button onClick={savePreNotes} className="gradient-primary w-full">
                Salvar Anotações
              </Button>
            </TabsContent>

            <TabsContent value="exportar" className="space-y-3 mt-3">
              <p className="text-sm text-muted-foreground mb-2">Exporte ou envie documentos ao paciente.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={exportProntuario} className="h-auto py-3 flex-col gap-1">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-xs">Prontuário PDF</span>
                </Button>
                <Button variant="outline" onClick={generateReceipt} className="h-auto py-3 flex-col gap-1">
                  <Receipt className="w-5 h-5 text-chart-3" />
                  <span className="text-xs">Recibo / Extrato</span>
                </Button>
                <Button variant="outline" onClick={exportCSV} disabled={!consultations.length} className="h-auto py-3 flex-col gap-1">
                  <FileDown className="w-5 h-5 text-chart-4" />
                  <span className="text-xs">CSV / Excel</span>
                </Button>
                <Button variant="outline" onClick={() => sendViaWhatsApp("recibo")} className="h-auto py-3 flex-col gap-1">
                  <Send className="w-5 h-5 text-chart-3" />
                  <span className="text-xs">Enviar WhatsApp</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                O prontuário inclui todo o histórico clínico. O recibo mostra apenas os valores e procedimentos para fins financeiros.
              </p>
            </TabsContent>
          </Tabs>
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
                <Select name="doctorId" defaultValue={patient?.doctor_id || undefined}>
                  <SelectTrigger className="glass"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="glass">
                    {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Medicações</Label>
                <Input name="medications" placeholder="Ex: Ácido hialurônico..." className="glass" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Quantidades</Label>
                <Input name="quantities" placeholder="Ex: 2 ampolas..." className="glass" />
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
