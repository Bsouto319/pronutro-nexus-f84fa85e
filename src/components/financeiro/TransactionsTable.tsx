import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { formatCurrency } from "./financeData";
import { useFinanceData } from "@/hooks/useFinanceData";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { EditGastoDialog } from "./EditGastoDialog";

const categoryColors: Record<string, string> = {
  alimentacao: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  transporte: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  saude: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  outros: "bg-muted text-muted-foreground border-border",
  "Débitos": "bg-red-500/15 text-red-400 border-red-500/30",
  "Impostos": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Repasses": "bg-violet-500/15 text-violet-400 border-violet-500/30",
  "Fixas": "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  "Variáveis": "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

export function TransactionsTable() {
  const { transactions, isLoading } = useFinanceData();
  const [filterCategory, setFilterCategory] = useState("");
  const [editGasto, setEditGasto] = useState<null | { id: string; description: string; category: string; fornecedor: string | null; paymentMethod: string | null; source: string }>(null);

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (filterCategory) result = result.filter(t => t.category === filterCategory);
    return result;
  }, [transactions, filterCategory]);

  const categories = useMemo(() => {
    const set = new Set(transactions.map(t => t.category).filter(Boolean));
    return Array.from(set);
  }, [transactions]);

  const selectClass = "bg-muted border border-border text-foreground px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/50";

  if (isLoading) {
    return <div className="glass rounded-xl p-12 animate-pulse bg-muted/20 h-[400px]" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="glass rounded-xl p-6 card-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-foreground">📋 Movimentações</h3>
          <p className="text-sm text-muted-foreground">{filtered.length} registros</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selectClass}>
          <option value="">Todas Categorias</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/30">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Data</th>
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Descrição</th>
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Categoria</th>
              <th className="text-right py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Valor</th>
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground italic">Nenhum registro encontrado.</td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="border-t border-border/20 hover:bg-primary/5 transition-colors group">
                  <td className="py-2.5 px-4 text-xs text-muted-foreground font-mono">{t.date}</td>
                  <td className="py-2.5 px-4">
                    <div className="text-xs text-foreground font-medium truncate max-w-[200px]" title={t.description}>
                      {t.description}
                    </div>
                    {t.fornecedor && <p className="text-[10px] text-muted-foreground">{t.fornecedor}</p>}
                  </td>
                  <td className="py-2.5 px-4">
                    <Badge variant="outline" className={cn("text-[10px] border", categoryColors[t.category] || categoryColors.outros)}>
                      {t.category}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 text-right text-xs font-bold text-destructive">
                    {formatCurrency(t.valueOut)}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-muted-foreground">{t.paymentMethod}</td>
                  <td className="py-2.5 px-1">
                    <button
                      onClick={() => setEditGasto({
                        id: t.id,
                        description: t.description,
                        category: t.category,
                        fornecedor: t.fornecedor,
                        paymentMethod: t.paymentMethod,
                        source: t.source,
                      })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                      title="Editar"
                    >
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EditGastoDialog
        open={!!editGasto}
        onOpenChange={(open) => { if (!open) setEditGasto(null); }}
        gasto={editGasto}
      />
    </motion.div>
  );
}
