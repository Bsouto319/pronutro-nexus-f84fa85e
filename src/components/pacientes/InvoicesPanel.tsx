import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Upload, Receipt, Download, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";

interface InvoicesPanelProps {
  patient: any | null;
  doctors: { id: string; name: string }[];
}

interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  issue_date: string | null;
  value: number;
  notes: string | null;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number | null;
  doctor_id: string | null;
  created_at: string;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const formatBytes = (b: number | null) => {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
};

export function InvoicesPanel({ patient, doctors }: InvoicesPanelProps) {
  const { organizationId } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [value, setValue] = useState("");
  const [doctorId, setDoctorId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["patient_invoices", patient?.id],
    enabled: !!patient?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_invoices" as any)
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as InvoiceRow[];
    },
  });

  const reset = () => {
    setFile(null);
    setInvoiceNumber("");
    setValue("");
    setNotes("");
    setDoctorId("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) { toast.error("Selecione um arquivo (PDF ou XML)"); return; }
    if (!patient?.id || !organizationId) { toast.error("Paciente inválido"); return; }

    const allowed = ["application/pdf", "application/xml", "text/xml"];
    const isXml = file.name.toLowerCase().endsWith(".xml");
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    if (!allowed.includes(file.type) && !isXml && !isPdf) {
      toast.error("Apenas arquivos PDF ou XML são permitidos");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx 15MB)");
      return;
    }

    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${organizationId}/${patient.id}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("patient-invoices")
        .upload(path, file, {
          contentType: file.type || (isPdf ? "application/pdf" : "application/xml"),
          upsert: false,
        });
      if (upErr) throw upErr;

      const { error: dbErr } = await supabase.from("patient_invoices" as any).insert({
        organization_id: organizationId,
        patient_id: patient.id,
        doctor_id: doctorId || patient.doctor_id || null,
        invoice_number: invoiceNumber || null,
        issue_date: issueDate || null,
        value: value ? Number(value) : 0,
        notes: notes || null,
        file_name: file.name,
        file_path: path,
        mime_type: file.type || (isPdf ? "application/pdf" : "application/xml"),
        file_size: file.size,
        uploaded_by: user?.id || null,
      });
      if (dbErr) throw dbErr;

      toast.success("Nota fiscal anexada!");
      reset();
      queryClient.invalidateQueries({ queryKey: ["patient_invoices", patient.id] });
    } catch (e: any) {
      toast.error(e?.message || "Erro ao anexar nota fiscal");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (inv: InvoiceRow) => {
    const { data, error } = await supabase.storage
      .from("patient-invoices")
      .createSignedUrl(inv.file_path, 600);
    if (error || !data?.signedUrl) {
      toast.error("Erro ao gerar link de download");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (inv: InvoiceRow) => {
    if (!confirm(`Remover a nota fiscal "${inv.file_name}"?`)) return;
    try {
      await supabase.storage.from("patient-invoices").remove([inv.file_path]);
      const { error } = await supabase.from("patient_invoices" as any).delete().eq("id", inv.id);
      if (error) throw error;
      toast.success("Nota fiscal removida");
      queryClient.invalidateQueries({ queryKey: ["patient_invoices", patient.id] });
    } catch (e: any) {
      toast.error(e?.message || "Erro ao remover");
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-4 border border-border/50 space-y-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm">Anexar Nova Nota Fiscal</h4>
        </div>

        <div>
          <Label className="text-xs">Arquivo (PDF ou XML)</Label>
          <Input
            ref={fileRef}
            type="file"
            accept=".pdf,.xml,application/pdf,application/xml,text/xml"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="glass"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Número da NF</Label>
            <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Ex: 12345" className="glass" />
          </div>
          <div>
            <Label className="text-xs">Data de Emissão</Label>
            <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="glass" />
          </div>
          <div>
            <Label className="text-xs">Valor (R$)</Label>
            <Input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} placeholder="0,00" className="glass" />
          </div>
          <div>
            <Label className="text-xs">Médico</Label>
            <select
              value={doctorId}
              onChange={e => setDoctorId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm glass"
            >
              <option value="">— Padrão do paciente —</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <Label className="text-xs">Observações</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Opcional" className="glass" />
        </div>

        <Button onClick={handleUpload} disabled={uploading || !file} className="gradient-primary w-full">
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "Enviando..." : "Anexar Nota Fiscal"}
        </Button>
      </div>

      <div>
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Notas Fiscais Anexadas ({invoices.length})
        </h4>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : invoices.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma nota fiscal anexada ainda.</p>
        ) : (
          <div className="space-y-2">
            {invoices.map(inv => (
              <div key={inv.id} className="glass rounded-lg p-3 border border-border/50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {inv.invoice_number ? `NF ${inv.invoice_number} — ` : ""}{inv.file_name}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    {inv.issue_date && <span>Emissão: {format(new Date(inv.issue_date + "T00:00:00"), "dd/MM/yyyy")}</span>}
                    <span>{formatCurrency(inv.value)}</span>
                    <span>{formatBytes(inv.file_size)}</span>
                    <span className="uppercase">{inv.mime_type.includes("pdf") ? "PDF" : "XML"}</span>
                  </div>
                  {inv.notes && <p className="text-[11px] text-muted-foreground italic mt-0.5 truncate">{inv.notes}</p>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => handleDownload(inv)} title="Baixar">
                  <Download className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(inv)} title="Remover" className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
