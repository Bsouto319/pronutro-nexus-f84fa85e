import { motion } from "framer-motion";
import { formatCurrency, banks } from "./financeData";
import { cn } from "@/lib/utils";

export function BankAccounts() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.5 }}
      className="glass rounded-xl p-6 card-shadow"
    >
      <h3 className="font-display font-semibold text-foreground mb-1">🏦 Por Banco / Conta</h3>
      <p className="text-sm text-muted-foreground mb-5">Movimentação por instituição</p>

      <div className="space-y-3">
        {banks.map((bank) => (
          <div key={bank.name} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">🏦 {bank.name}</span>
              <span className={cn(
                "text-sm font-bold",
                bank.saldo >= 0 ? "text-success" : "text-destructive"
              )}>
                {formatCurrency(bank.saldo)}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>↑ <span className="text-success">{formatCurrency(bank.entradas)}</span></span>
              <span>↓ <span className="text-destructive">{formatCurrency(bank.saidas)}</span></span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
