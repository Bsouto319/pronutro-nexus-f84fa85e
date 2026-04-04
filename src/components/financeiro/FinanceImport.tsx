import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function FinanceImport() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const parseCSV = (text: string): string[][] => {
    const lines = text.split("\n").filter(l => l.trim());
    return lines.map(line => {
      // Handle both ; and , separators
      const sep = line.includes(";") ? ";" : ",";
      return line.split(sep).map(cell => cell.replace(/^"|"$/g, "").trim());
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organizationId) return;

    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length < 2) {
        toast.error("Arquivo vazio ou sem dados.");
        return;
      }

      const headers = rows[0].map(h => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
      const dataRows = rows.slice(1);

      const findCol = (keywords: string[]) =>
        headers.findIndex(h => keywords.some(k => h.includes(k)));

      const dateIdx = findCol(["data"]);
      const descIdx = findCol(["descri", "descricao"]);
      const catIdx = findCol(["categ"]);
      const entradaIdx = findCol(["entrada", "receita", "value_in", "credito"]);
      const saidaIdx = findCol(["saida", "despesa", "value_out", "debito"]);
      const pagIdx = findCol(["pagamento", "metodo", "payment"]);

      if (dateIdx === -1 && descIdx === -1) {
        toast.error("Não foi possível identificar as colunas. Use cabeçalhos como: Data, Descrição, Entrada, Saída.");
        return;
      }

      const records = dataRows
        .filter(row => row.length > 1)
        .map(row => ({
          organization_id: organizationId,
          date: row[dateIdx] || new Date().toISOString().split("T")[0],
          description: row[descIdx >= 0 ? descIdx : 0] || "Importado",
          category: catIdx >= 0 ? row[catIdx] : "importado",
          type: entradaIdx >= 0 && parseFloat(row[entradaIdx]?.replace(",", ".") || "0") > 0 ? "entrada" : "saida",
          value_in: entradaIdx >= 0 ? parseFloat(row[entradaIdx]?.replace(",", ".") || "0") : 0,
          value_out: saidaIdx >= 0 ? parseFloat(row[saidaIdx]?.replace(",", ".") || "0") : 0,
          payment_method: pagIdx >= 0 ? row[pagIdx] : null,
        }));

      if (records.length === 0) {
        toast.error("Nenhum registro válido encontrado no arquivo.");
        return;
      }

      const { error } = await supabase
        .from("financial_transactions")
        .insert(records);

      if (error) throw error;

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
          <p className="text-xs text-muted-foreground">Importe dados de CSV ou Excel (.csv) com colunas: Data, Descrição, Entrada, Saída</p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
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
            {importing ? "Importando..." : "Importar CSV"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
