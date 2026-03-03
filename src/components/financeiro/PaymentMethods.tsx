import { motion } from "framer-motion";
import { formatCurrency } from "./financeData";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useMemo } from "react";

const COLORS = [
  "hsl(168, 80%, 44%)",
  "hsl(210, 80%, 55%)",
  "hsl(260, 60%, 55%)",
  "hsl(32, 85%, 55%)",
  "hsl(350, 70%, 55%)",
];

export function PaymentMethods() {
  const { transactions, isLoading } = useFinanceData();

  const methodsData = useMemo(() => {
    const methods = ["Pix", "Cartão", "Dinheiro", "Boleto", "Transferência"];
    const results = methods.map(method => {
      const total = transactions
        .filter(t => t.paymentMethod?.toLowerCase().includes(method.toLowerCase()) && t.type === "entrada")
        .reduce((sum, t) => sum + (t.valueIn || 0), 0);
      return { name: method, total };
    }).filter(m => m.total > 0);

    const grandTotal = results.reduce((acc, m) => acc + m.total, 0) || 1;
    return results.map(m => ({
      ...m,
      percentage: Math.round((m.total / grandTotal) * 100)
    })).sort((a, b) => b.total - a.total);
  }, [transactions]);

  if (isLoading) return <div className="glass rounded-xl p-6 h-[150px] animate-pulse bg-muted/20" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="glass rounded-xl p-6 card-shadow"
    >
      <h3 className="font-display font-semibold text-foreground mb-1">💳 Forma de Pagamento</h3>
      <p className="text-sm text-muted-foreground mb-5">Distribuição por método</p>

      <div className="space-y-3">
        {methodsData.length === 0 ? (
          <p className="text-center py-4 text-xs text-muted-foreground italic">Sem dados de entrada</p>
        ) : (
          methodsData.map((method, i) => (
            <div key={method.name} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-sm text-foreground truncate">{method.name}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-muted-foreground">{method.percentage}%</span>
                <span className="text-sm font-semibold" style={{ color: COLORS[i % COLORS.length] }}>{formatCurrency(method.total)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
