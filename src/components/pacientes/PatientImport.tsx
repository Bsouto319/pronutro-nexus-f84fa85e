import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const normalizeHeader = (h: string) =>
  String(h || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const onlyDigits = (v: string) => String(v || "").replace(/\D/g, "");

const parseDateBR = (val: string): string | null => {
  if (!val) return null;
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (s.includes("/")) {
    const [a, b, c] = s.split("/");
    if (a && b && c) {
      const year = c.length === 2 ? "19" + c : c;
      const dd = a.padStart(2, "0");
      const mm = b.padStart(2, "0");
      // Brazilian format DD/MM/YYYY
      if (parseInt(a) > 12) return `${year}-${mm}-${dd}`;
      return `${year}-${mm}-${dd}`;
    }
  }
  return null;
};

const findCol = (headers: string[], keywords: string[]) =>
  headers.findIndex((h) => keywords.some((k) => h.includes(k)));

export function PatientImport() {
  const { organizationId } = useOrganization();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const parseFile = async (file: File): Promise<string[][]> => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
      return json.map((r) => r.map((c: any) => String(c ?? "")));
    }
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    return lines.map((line) => {
      const sep = line.includes(";") ? ";" : ",";
      return line.split(sep).map((c) => c.replace(/^"|"$/g, "").trim());
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organizationId) return;

    setImporting(true);
    try {
      const rows = await parseFile(file);
      if (rows.length < 2) {
        toast.error("Arquivo vazio ou sem dados.");
        return;
      }

      const headers = rows[0].map(normalizeHeader);
      const dataRows = rows.slice(1);

      const nameIdx = findCol(headers, ["nome", "paciente", "cliente", "name"]);
      const phoneIdx = findCol(headers, ["telefone", "celular", "whatsapp", "fone", "phone"]);
      const emailIdx = findCol(headers, ["email", "e-mail"]);
      const cpfIdx = findCol(headers, ["cpf"]);
      const birthIdx = findCol(headers, ["nascimento", "birth", "aniversario", "aniversário"]);
      const refIdx = findCol(headers, ["indica", "referral"]);
      const payIdx = findCol(headers, ["pagamento", "payment"]);
      const notesIdx = findCol(headers, ["observ", "notes", "anota"]);

      if (nameIdx === -1) {
        toast.error("Coluna 'Nome' não encontrada. Inclua um cabeçalho com Nome.");
        return;
      }

      // Carrega pacientes existentes para deduplicação
      const { data: existing } = await supabase
        .from("clinic_patients")
        .select("name, phone")
        .eq("organization_id", organizationId);

      const existingKeys = new Set(
        (existing || []).map(
          (p) => `${(p.name || "").toLowerCase().trim()}|${onlyDigits(p.phone || "")}`,
        ),
      );

      const seen = new Set<string>();
      const records: any[] = [];
      let skipped = 0;

      for (const row of dataRows) {
        if (!row.some((c) => c && c.trim())) continue;
        const name = (row[nameIdx] || "").trim();
        if (!name) {
          skipped++;
          continue;
        }
        const phoneDigits = phoneIdx >= 0 ? onlyDigits(row[phoneIdx]) : "";
        const key = `${name.toLowerCase()}|${phoneDigits}`;
        if (existingKeys.has(key) || seen.has(key)) {
          skipped++;
          continue;
        }
        seen.add(key);

        records.push({
          organization_id: organizationId,
          name,
          phone: phoneIdx >= 0 ? row[phoneIdx]?.trim() || null : null,
          email: emailIdx >= 0 ? row[emailIdx]?.trim() || null : null,
          cpf: cpfIdx >= 0 ? row[cpfIdx]?.trim() || null : null,
          birth_date: birthIdx >= 0 ? parseDateBR(row[birthIdx]) : null,
          referral: refIdx >= 0 ? row[refIdx]?.trim() || null : null,
          payment_method: payIdx >= 0 ? row[payIdx]?.trim() || null : null,
          important_notes: notesIdx >= 0 ? row[notesIdx]?.trim() || null : null,
        });
      }

      if (records.length === 0) {
        toast.warning(
          skipped > 0
            ? `Nenhum paciente novo. ${skipped} já cadastrados ou inválidos.`
            : "Nenhum registro válido encontrado.",
        );
        return;
      }

      const batch = 500;
      for (let i = 0; i < records.length; i += batch) {
        const { error } = await supabase
          .from("clinic_patients")
          .insert(records.slice(i, i + batch));
        if (error) throw error;
      }

      toast.success(
        `${records.length} pacientes importados!${skipped > 0 ? ` (${skipped} ignorados/duplicados)` : ""}`,
      );
      qc.invalidateQueries({ queryKey: ["clinic_patients"] });
    } catch (err: any) {
      if (import.meta.env.DEV) console.error(err);
      toast.error(err?.message || "Erro ao importar arquivo.");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "Nome", "Telefone", "Email", "CPF", "Nascimento", "Indicação", "Pagamento", "Observações",
    ];
    const ex1 = ["Maria Silva", "(61) 99999-8888", "maria@email.com", "000.000.000-00", "15/05/1985", "Dr. João", "Pix", ""];
    const ex2 = ["Carlos Souza", "(11) 98888-7777", "carlos@email.com", "", "", "Instagram", "Cartão", "Alérgico a dipirona"];
    const ws = XLSX.utils.aoa_to_sheet([headers, ex1, ex2]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pacientes");
    XLSX.writeFile(wb, "modelo_pacientes.xlsx");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4 card-shadow"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display font-semibold text-foreground text-sm">
            📥 Importar pacientes de planilha
          </h3>
          <p className="text-xs text-muted-foreground">
            Aceita Excel (.xlsx) ou CSV. Colunas: Nome, Telefone, Email, CPF, Nascimento, Indicação, Pagamento, Observações.
            Duplicados (mesmo nome + telefone) são ignorados.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={downloadTemplate} className="text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Modelo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="text-xs gap-1.5"
          >
            {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {importing ? "Importando..." : "Importar planilha"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
