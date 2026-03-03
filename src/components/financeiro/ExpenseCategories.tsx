import { useMemo } from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "./financeData";
import { useFinanceData } from "@/hooks/useFinanceData";

interface Gasto {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  fornecedor: string;
}

function ExpenseCard({ title, emoji, items }: { title: string; emoji: string; items: Gasto[] }) {
  const total = items.reduce((acc, i) => acc + (i.valor || 0), 0);

  return (
    <div className="glass rounded-xl p-5 card-shadow">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/30">
        <h3 className="font-display font-semibold text-foreground text-sm">
          {emoji} {title}
        </h3>
        <span className="text-sm font-bold text-destructive">{formatCurrency(total)}</span>
      </div>
      <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
        {items.length === 0 ? (
          <p className="text-center py-4 text-xs text-muted-foreground italic">Nenhum item</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/30 transition-colors text-sm">
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-xs font-medium">{item.descricao}</p>
                {item.fornecedor && <p className="text-[11px] text-muted-foreground truncate">{item.fornecedor}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-xs font-semibold text-destructive">{formatCurrency(item.valor)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ExpenseCategories() {
  const { gastos, isLoading } = useFinanceData();

  const sections = useMemo(() => {
    return [
      { title: "Débitos", emoji: "💸", items: gastos.filter(g => g.categoria === "Débitos") },
      { title: "Impostos", emoji: "📋", items: gastos.filter(g => g.categoria === "Impostos") },
      { title: "Repasses", emoji: "🔄", items: gastos.filter(g => g.categoria === "Repasses") },
      { title: "Despesas Fixas", emoji: "📌", items: gastos.filter(g => g.categoria === "Fixas") },
      { title: "Despesas Variáveis", emoji: "📦", items: gastos.filter(g => g.categoria === "Variáveis") },
    ];
  }, [gastos]);

  if (isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map((section) => (
          <ExpenseCard key={section.title} title={section.title} emoji={section.emoji} items={section.items} />
        ))}
      </div>
    </motion.div>
  );
}
