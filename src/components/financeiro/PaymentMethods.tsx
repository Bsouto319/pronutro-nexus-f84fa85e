import { motion } from "framer-motion";
import { formatCurrency, paymentMethods } from "./financeData";

const colors = [
  "hsl(168, 80%, 44%)",
  "hsl(210, 80%, 55%)",
  "hsl(260, 60%, 55%)",
  "hsl(32, 85%, 55%)",
  "hsl(350, 70%, 55%)",
];

export function PaymentMethods() {
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
        {paymentMethods.map((method, i) => (
          <div key={method.name} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i] }} />
              <span className="text-sm text-foreground truncate">{method.name}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-muted-foreground">{method.percentage}%</span>
              <span className="text-sm font-semibold" style={{ color: colors[i] }}>{formatCurrency(method.total)}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
