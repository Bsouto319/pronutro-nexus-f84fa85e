import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Loader2, FileSpreadsheet, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const parseCurrencyBR = (val: string | number | null | undefined): number => {
  if (val == null || val === "") return 0;
  const str = String(val).replace(/R\$\s*/g, "").replace(/\./g, "").replace(",", ".").trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.abs(num);
};

const normalizeHeader = (h: string) =>
  h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export function FinanceImport() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const parseFile = async (file: File): Promise<string[][]> => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "xlsx" || ext === "xls") {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
      return json.map(row => row.map((cell: any) => String(cell ?? "")));
    }

    // CSV / TXT
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    return lines.map(line => {
      const sep = line.includes(";") ? ";" : ",";
      return line.split(sep).map(cell => cell.replace(/^"|"$/g, "").trim());
    });
  };

  const findCol = (headers: string[], keywords: string[]) =>
    headers.findIndex(h => keywords.some(k => h.includes(k)));

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

      // Map columns matching spreadsheet model:
      // Data | Descrição | Categoria | Tipo | Entrada | Saida | Cartao | parcela | Valor Total
      const dateIdx = findCol(headers, ["data"]);
      const descIdx = findCol(headers, ["descri", "descricao"]);
      const catIdx = findCol(headers, ["categ"]);
      const tipoIdx = findCol(headers, ["tipo"]);
      const entradaIdx = findCol(headers, ["entrada", "receita", "value_in", "credito"]);
      const saidaIdx = findCol(headers, ["saida", "despesa", "value_out", "debito"]);
      const cartaoIdx = findCol(headers, ["cartao", "cartão"]);
      const parcelaIdx = findCol(headers, ["parcela", "installment"]);
      const pagIdx = findCol(headers, ["pagamento", "metodo", "payment"]);
      const bankIdx = findCol(headers, ["banco", "bank"]);

      if (dateIdx === -1 && descIdx === -1) {
        toast.error("Não foi possível identificar as colunas. Use cabeçalhos como: Data, Descrição, Categoria, Tipo, Entrada, Saída.");
        return;
      }

      const records = dataRows
        .filter(row => row.length > 1 && row.some(c => c.trim()))
        .map(row => {
          const entradaVal = parseCurrencyBR(row[entradaIdx]);
          const saidaVal = parseCurrencyBR(row[saidaIdx]);
          const cartaoVal = parseCurrencyBR(cartaoIdx >= 0 ? row[cartaoIdx] : "0");

          // Determine type from "Tipo" column or from values
          let tipo = "saida";
          if (tipoIdx >= 0) {
            const rawTipo = normalizeHeader(row[tipoIdx]);
            if (rawTipo.includes("entrada") || rawTipo.includes("salario")) tipo = "entrada";
            else if (rawTipo.includes("fatura")) tipo = "saida";
            else if (rawTipo.includes("saida") || rawTipo.includes("saída")) tipo = "saida";
            else if (entradaVal > 0) tipo = "entrada";
          } else if (entradaVal > 0) {
            tipo = "entrada";
          }

          const totalOut = saidaVal + cartaoVal;
          const installments = parcelaIdx >= 0 ? parseInt(row[parcelaIdx]) || 1 : 1;

          // Parse date - handle M/D/YY or DD/MM/YYYY formats
          let dateStr = row[dateIdx] || new Date().toISOString().split("T")[0];
          if (dateStr.includes("/")) {
            const parts = dateStr.split("/");
            if (parts.length === 3) {
              let year = parts[2].length === 2 ? "20" + parts[2] : parts[2];
              // If first part > 12, assume DD/MM/YYYY
              if (parseInt(parts[0]) > 12) {
                dateStr = `${year}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
              } else {
                // M/D/YYYY (US format from Excel)
                dateStr = `${year}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
              }
            }
          }

          return {
            organization_id: organizationId,
            date: dateStr,
            description: row[descIdx >= 0 ? descIdx : 0] || "Importado",
            category: catIdx >= 0 ? row[catIdx] : "importado",
            type: tipo,
            value_in: tipo === "entrada" ? entradaVal : 0,
            value_out: tipo === "saida" ? totalOut : 0,
            payment_method: cartaoVal > 0
              ? "Cartão de Crédito"
              : (pagIdx >= 0 ? row[pagIdx] : null),
            bank: bankIdx >= 0 ? row[bankIdx] : (descIdx >= 0 ? row[descIdx] : null),
            installments,
          };
        })
        .filter(r => r.value_in > 0 || r.value_out > 0);

      if (records.length === 0) {
        toast.error("Nenhum registro válido encontrado no arquivo.");
        return;
      }

      // Insert in batches of 500
      const batchSize = 500;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase.from("financial_transactions").insert(batch);
        if (error) throw error;
      }

      toast.success(`${records.length} registros importados com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["financial_transactions"] });
    } catch (err: any) {
      if (import.meta.env.DEV) console.error(err);
      toast.error("Erro ao importar arquivo. Verifique o formato.");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const headers = ["Data", "Descrição", "Categoria", "Tipo", "Entrada", "Saida", "Cartao", "parcela"];
    const example = ["01/03/2026", "Salário", "Salário", "Entrada", "5000", "", "", ""];
    const example2 = ["05/03/2026", "Nu Monica", "Mercado", "saida", "", "176", "27.42", "1"];
    const ws = XLSX.utils.aoa_to_sheet([headers, example, example2]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "modelo_financeiro.xlsx");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="glass rounded-xl p-4 card-shadow"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display font-semibold text-foreground text-sm">📥 Importar Planilha</h3>
          <p className="text-xs text-muted-foreground">
            Importe CSV ou Excel (.xlsx) com colunas: Data, Descrição, Categoria, Tipo, Entrada, Saída, Cartão, Parcela
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadTemplate}
            className="text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar Modelo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
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
            {importing ? "Importando..." : "Importar Planilha"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
