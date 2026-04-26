import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Printer, Send, Trash2, FileText, Pill, FlaskConical, FileSignature } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";

interface Prescription {
  id: string;
  prescription_type: string;
  title: string;
  content: string;
  instructions: string | null;
  cid: string | null;
  issued_date: string;
  doctor_id: string | null;
  created_at: string;
}

interface Props {
  patient: any;
  doctors: { id: string; name: string; crm?: string | null }[];
  organization: any;
}

const TYPES = [
  { value: "receita_simples", label: "Receita Simples", icon: Pill },
  { value: "receita_controlada", label: "Receita Controlada (Especial)", icon: FileSignature },
  { value: "pedido_exames", label: "Pedido de Exames", icon: FlaskConical },
  { value: "atestado", label: "Atestado Médico", icon: FileText },
];

const TEMPLATES: Record<string, { title: string; content: string; instructions: string }> = {
  receita_simples: {
    title: "Receita Médica",
    content: "Dipirona 500mg — 1 comprimido de 6/6h se dor\nAmoxicilina 500mg — 1 cápsula de 8/8h por 7 dias",
    instructions: "Tomar com bastante água. Em caso de reação alérgica, suspender o uso e procurar atendimento.",
  },
  receita_controlada: {
    title: "Receita Especial — Controle Especial",
    content: "Clonazepam 2mg — 1 comprimido ao deitar\nQuantidade: 30 comprimidos",
    instructions: "Uso contínuo. Não interromper sem orientação médica.",
  },
  pedido_exames: {
    title: "Solicitação de Exames",
    content: "- Hemograma completo\n- Glicemia de jejum\n- Colesterol total e frações\n- TSH e T4 livre\n- Ureia e creatinina",
    instructions: "Comparecer em jejum de 12 horas. Trazer documento com foto.",
  },
  atestado: {
    title: "Atestado Médico",
    content: "Atesto, para os devidos fins, que o(a) paciente esteve sob meus cuidados nesta data,\nnecessitando de afastamento de suas atividades por ___ dia(s).",
    instructions: "CID-10: ___",
  },
};

const formatDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("pt-BR");

export function PrescriptionsPanel({ patient, doctors, organization }: Props) {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState("receita_simples");
  const [title, setTitle] = useState(TEMPLATES.receita_simples.title);
  const [content, setContent] = useState(TEMPLATES.receita_simples.content);
  const [instructions, setInstructions] = useState(TEMPLATES.receita_simples.instructions);
  const [cid, setCid] = useState("");
  const [doctorId, setDoctorId] = useState<string>(patient?.doctor_id || "");

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ["prescriptions", patient?.id],
    enabled: !!patient?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_prescriptions" as any)
        .select("*")
        .eq("patient_id", patient.id)
        .order("issued_date", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Prescription[];
    },
  });

  const onTypeChange = (v: string) => {
    setType(v);
    const t = TEMPLATES[v];
    if (t) {
      setTitle(t.title);
      setContent(t.content);
      setInstructions(t.instructions);
    }
  };

  const resetForm = () => {
    setType("receita_simples");
    setTitle(TEMPLATES.receita_simples.title);
    setContent(TEMPLATES.receita_simples.content);
    setInstructions(TEMPLATES.receita_simples.instructions);
    setCid("");
  };

  const getDoctor = (id: string | null) => doctors.find(d => d.id === id);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !patient) return;
    if (!content.trim()) { toast.error("Adicione o conteúdo da prescrição."); return; }
    setSubmitting(true);
    const { error } = await supabase.from("patient_prescriptions" as any).insert([{
      organization_id: organizationId,
      patient_id: patient.id,
      doctor_id: doctorId || null,
      prescription_type: type,
      title,
      content,
      instructions: instructions || null,
      cid: cid || null,
    }]);
    setSubmitting(false);
    if (error) { toast.error("Erro ao salvar prescrição."); return; }
    toast.success("Prescrição criada!");
    setOpen(false);
    resetForm();
    queryClient.invalidateQueries({ queryKey: ["prescriptions", patient.id] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta prescrição?")) return;
    const { error } = await supabase.from("patient_prescriptions" as any).delete().eq("id", id);
    if (error) { toast.error("Erro ao remover."); return; }
    toast.success("Prescrição removida.");
    queryClient.invalidateQueries({ queryKey: ["prescriptions", patient.id] });
  };

  const buildHTML = (p: Prescription) => {
    const doc = getDoctor(p.doctor_id);
    const orgName = organization?.name || organization?.legal_name || "Clínica";
    const orgPhone = organization?.phone || organization?.whatsapp || "";
    const orgAddr = [organization?.address_street, organization?.address_number, organization?.address_neighborhood, organization?.address_city, organization?.address_state]
      .filter(Boolean).join(", ");
    const isControlled = p.prescription_type === "receita_controlada";
    return `<!doctype html><html><head><meta charset="utf-8"><title>${p.title} - ${patient.name}</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: 'Helvetica', Arial, sans-serif; color:#111; line-height:1.5; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid ${isControlled ? "#dc2626" : "#8B5CF6"}; padding-bottom:14px; margin-bottom:24px; }
  .clinic h1 { margin:0; font-size:20px; color:${isControlled ? "#dc2626" : "#8B5CF6"}; }
  .clinic p { margin:2px 0; font-size:11px; color:#555; }
  .badge { background:${isControlled ? "#dc2626" : "#8B5CF6"}; color:#fff; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; }
  .patient { background:#f8f8fc; padding:12px 16px; border-radius:8px; margin-bottom:20px; font-size:13px; }
  .patient strong { display:inline-block; min-width:80px; color:#666; font-weight:600; }
  h2 { font-size:16px; margin:24px 0 12px; padding-bottom:6px; border-bottom:1px solid #ddd; color:#222; }
  .content { white-space:pre-wrap; font-size:14px; padding:16px; background:#fafafa; border-left:4px solid ${isControlled ? "#dc2626" : "#8B5CF6"}; border-radius:4px; }
  .instructions { font-size:12px; color:#444; margin-top:12px; padding:10px; background:#fff8e1; border-radius:4px; }
  .signature { margin-top:80px; text-align:center; }
  .signature .line { border-top:1px solid #333; width:300px; margin:0 auto 6px; }
  .signature p { margin:2px 0; font-size:12px; }
  .footer { position:fixed; bottom:10mm; left:20mm; right:20mm; text-align:center; font-size:10px; color:#888; border-top:1px solid #eee; padding-top:8px; }
  .controlled-warning { background:#fef2f2; color:#991b1b; border:1px solid #dc2626; padding:8px 12px; border-radius:4px; font-size:11px; font-weight:bold; margin-bottom:16px; text-align:center; }
  @media print { .no-print { display:none } }
</style></head><body>
  <div class="header">
    <div class="clinic">
      <h1>${orgName}</h1>
      ${orgAddr ? `<p>${orgAddr}</p>` : ""}
      ${orgPhone ? `<p>Tel: ${orgPhone}</p>` : ""}
    </div>
    <span class="badge">${TYPES.find(t => t.value === p.prescription_type)?.label || p.title}</span>
  </div>

  ${isControlled ? `<div class="controlled-warning">⚠ RECEITUÁRIO DE CONTROLE ESPECIAL — Portaria 344/98</div>` : ""}

  <div class="patient">
    <p><strong>Paciente:</strong> ${patient.name}</p>
    ${patient.cpf ? `<p><strong>CPF:</strong> ${patient.cpf}</p>` : ""}
    ${patient.birth_date ? `<p><strong>Nascimento:</strong> ${formatDate(patient.birth_date)}</p>` : ""}
    <p><strong>Data:</strong> ${formatDate(p.issued_date)}</p>
    ${p.cid ? `<p><strong>CID-10:</strong> ${p.cid}</p>` : ""}
  </div>

  <h2>${p.title}</h2>
  <div class="content">${p.content.replace(/</g, "&lt;")}</div>

  ${p.instructions ? `<div class="instructions"><strong>Orientações:</strong><br>${p.instructions.replace(/</g, "&lt;").replace(/\n/g, "<br>")}</div>` : ""}

  <div class="signature">
    <div class="line"></div>
    <p><strong>${doc?.name || "Médico Responsável"}</strong></p>
    ${doc?.crm ? `<p>CRM: ${doc.crm}</p>` : ""}
  </div>

  <div class="footer">Documento emitido eletronicamente em ${new Date().toLocaleString("pt-BR")} • ${orgName}</div>

  <div class="no-print" style="position:fixed;top:10px;right:10px;">
    <button onclick="window.print()" style="padding:8px 16px;background:#8B5CF6;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">🖨 Imprimir / Salvar PDF</button>
  </div>
</body></html>`;
  };

  const printPrescription = (p: Prescription) => {
    const w = window.open("", "_blank");
    if (!w) { toast.error("Bloqueador de pop-up impediu a abertura."); return; }
    w.document.write(buildHTML(p));
    w.document.close();
    setTimeout(() => w.print(), 600);
  };

  const sendWhatsApp = (p: Prescription) => {
    const phone = (patient.phone || "").replace(/\D/g, "");
    if (!phone) { toast.error("Paciente sem telefone cadastrado."); return; }
    const num = phone.startsWith("55") ? phone : `55${phone}`;
    const doc = getDoctor(p.doctor_id);
    const typeLabel = TYPES.find(t => t.value === p.prescription_type)?.label || "Documento";
    const msg = `Olá ${patient.name.split(" ")[0]}! 👋\n\nSegue seu(a) *${typeLabel}* emitido(a) em ${formatDate(p.issued_date)}${doc ? ` por ${doc.name}` : ""}.\n\n📄 *${p.title}*\n\n${p.content}${p.instructions ? `\n\n📌 *Orientações:*\n${p.instructions}` : ""}\n\nQualquer dúvida, estamos à disposição. 💜`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success("Abrindo WhatsApp...");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Emita receitas, pedidos de exames e atestados. Imprima em PDF ou envie pelo WhatsApp.
        </p>
        <Button size="sm" className="gradient-primary" onClick={() => setOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Nova Prescrição
        </Button>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-6 text-sm">Carregando...</p>
      ) : prescriptions.length === 0 ? (
        <p className="text-center text-muted-foreground py-6 text-sm">Nenhuma prescrição emitida.</p>
      ) : (
        prescriptions.map(p => {
          const Icon = TYPES.find(t => t.value === p.prescription_type)?.icon || FileText;
          const isControlled = p.prescription_type === "receita_controlada";
          return (
            <div key={p.id} className={`glass rounded-lg p-3 border space-y-2 ${isControlled ? "border-destructive/40" : "border-border/50"}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isControlled ? "text-destructive" : "text-primary"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(p.issued_date)} • {getDoctor(p.doctor_id)?.name || "—"}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-destructive p-1 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 pl-6">{p.content}</p>
              <div className="flex gap-2 pl-6">
                <Button size="sm" variant="outline" onClick={() => printPrescription(p)} className="h-7 text-xs">
                  <Printer className="w-3 h-3 mr-1" /> Imprimir / PDF
                </Button>
                <Button size="sm" variant="outline" onClick={() => sendWhatsApp(p)} className="h-7 text-xs">
                  <Send className="w-3 h-3 mr-1" /> WhatsApp
                </Button>
              </div>
            </div>
          );
        })
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="glass border-primary/20 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">Nova Prescrição</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={onTypeChange}>
                  <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass">
                    {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Médico Responsável</Label>
                <Select value={doctorId} onValueChange={setDoctorId}>
                  <SelectTrigger className="glass"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="glass">
                    {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Título do documento</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} className="glass" required />
            </div>
            <div className="space-y-1">
              <Label>Conteúdo (uma linha por item)</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} rows={6} className="glass font-mono text-sm" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label>Orientações ao paciente</Label>
                <Textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={2} className="glass" />
              </div>
              <div className="space-y-1">
                <Label>CID-10 (opcional)</Label>
                <Input value={cid} onChange={e => setCid(e.target.value)} placeholder="Ex: J00" className="glass" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full gradient-primary" disabled={submitting}>
                {submitting ? "Salvando..." : "Emitir Prescrição"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
