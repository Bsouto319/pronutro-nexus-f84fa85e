import { useState } from "react";
import { motion } from "framer-motion";
import { FileDown, FileSpreadsheet, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinanceData } from "@/hooks/useFinanceData";
import { formatCurrency } from "./financeData";
import { toast } from "sonner";

export function FinanceExport() {
  const { transactions, kpis } = useFinanceData();
  const [exporting, setExporting] = useState<string | null>(null);

  const exportCSV = () => {
    setExporting("csv");
    try {
      const headers = ["Data", "Descrição", "Categoria", "Fornecedor", "Método Pagamento", "Entrada", "Saída"];
      const rows = transactions.map(t => [
        t.date,
        t.description,
        t.category,
        t.fornecedor || "",
        t.paymentMethod || "",
        t.valueIn.toString(),
        t.valueOut.toString(),
      ]);

      const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financeiro_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar CSV");
    } finally {
      setExporting(null);
    }
  };

  const exportPDF = () => {
    setExporting("pdf");
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Permita pop-ups para exportar PDF");
        setExporting(null);
        return;
      }

      const tableRows = transactions
        .map(
          (t) =>
            `<tr>
              <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;">${t.date}</td>
              <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;">${t.description}</td>
              <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;">${t.category}</td>
              <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;">${t.fornecedor || "-"}</td>
              <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;">${t.paymentMethod || "-"}</td>
              <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;text-align:right;color:#16a34a;">${t.valueIn > 0 ? formatCurrency(t.valueIn) : "-"}</td>
              <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;text-align:right;color:#dc2626;">${t.valueOut > 0 ? formatCurrency(t.valueOut) : "-"}</td>
            </tr>`
        )
        .join("");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html><head><title>Relatório Financeiro</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #1a1a1a; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .subtitle { font-size: 13px; color: #666; margin-bottom: 20px; }
          .kpis { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
          .kpi { background: #f8f8f8; border-radius: 8px; padding: 12px 18px; min-width: 140px; }
          .kpi-label { font-size: 10px; text-transform: uppercase; color: #888; }
          .kpi-value { font-size: 18px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background: #f0f0f0; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; color: #555; }
          @media print { body { padding: 10px; } }
        </style></head>
        <body>
          <h1>📊 Relatório Financeiro</h1>
          <p class="subtitle">Gerado em ${new Date().toLocaleDateString("pt-BR")} • ${transactions.length} registros</p>
          <div class="kpis">
            <div class="kpi"><div class="kpi-label">Entradas</div><div class="kpi-value" style="color:#16a34a">${formatCurrency(kpis.totalEntradas)}</div></div>
            <div class="kpi"><div class="kpi-label">Saídas</div><div class="kpi-value" style="color:#dc2626">${formatCurrency(kpis.totalSaidas)}</div></div>
            <div class="kpi"><div class="kpi-label">Saldo</div><div class="kpi-value">${formatCurrency(kpis.saldo)}</div></div>
          </div>
          <table>
            <thead><tr>
              <th>Data</th><th>Descrição</th><th>Categoria</th><th>Fornecedor</th><th>Pagamento</th><th style="text-align:right">Entrada</th><th style="text-align:right">Saída</th>
            </tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
      toast.success("PDF pronto para impressão!");
    } catch {
      toast.error("Erro ao gerar PDF");
    } finally {
      setExporting(null);
    }
  };

  const shareWhatsApp = () => {
    const summary = `📊 *Relatório Financeiro*\n📅 ${new Date().toLocaleDateString("pt-BR")}\n\n` +
      `✅ Entradas: ${formatCurrency(kpis.totalEntradas)}\n` +
      `❌ Saídas: ${formatCurrency(kpis.totalSaidas)}\n` +
      `💰 Saldo: ${formatCurrency(kpis.saldo)}\n` +
      `📋 Total de movimentações: ${kpis.totalTransacoes}\n\n` +
      `🔝 Últimas 5 movimentações:\n` +
      transactions.slice(0, 5).map(t =>
        `• ${t.date} - ${t.description}: ${t.valueOut > 0 ? `-${formatCurrency(t.valueOut)}` : `+${formatCurrency(t.valueIn)}`}`
      ).join("\n");

    const url = `https://wa.me/?text=${encodeURIComponent(summary)}`;
    window.open(url, "_blank");
    toast.success("WhatsApp aberto para compartilhamento!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="glass rounded-xl p-4 card-shadow"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display font-semibold text-foreground text-sm">📤 Exportar & Compartilhar</h3>
          <p className="text-xs text-muted-foreground">Envie relatórios para o contador ou equipe</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={exportPDF}
            disabled={!!exporting}
            className="text-xs gap-1.5"
          >
            {exporting === "pdf" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={!!exporting}
            className="text-xs gap-1.5"
          >
            {exporting === "csv" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            CSV / Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={shareWhatsApp}
            className="text-xs gap-1.5 border-green-500/30 text-green-500 hover:bg-green-500/10"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
