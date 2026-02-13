import { motion } from "framer-motion";
import { formatCurrency, expenses } from "./financeData";

interface ExpenseSection {
  title: string;
  emoji: string;
  data: { total: number; items: { desc: string; patient: string; value: number; bank: string }[] };
}

const sections: ExpenseSection[] = [
  { title: "Débitos", emoji: "💸", data: expenses.debitos },
  { title: "Impostos", emoji: "📋", data: expenses.impostos },
  { title: "Repasses", emoji: "🔄", data: expenses.repasses },
  { title: "Despesas Fixas", emoji: "📌", data: expenses.fixas },
  { title: "Despesas Variáveis", emoji: "📦", data: expenses.variaveis },
];

function ExpenseCard({ section }: { section: ExpenseSection }) {
  return (
    <div className="glass rounded-xl p-5 card-shadow">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/30">
        <h3 className="font-display font-semibold text-foreground text-sm">
          {section.emoji} {section.title}
        </h3>
        <span className="text-sm font-bold text-destructive">{formatCurrency(section.data.total)}</span>
      </div>
      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {section.data.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/30 transition-colors text-sm">
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-xs font-medium">{item.desc}</p>
              {item.patient && <p className="text-[11px] text-muted-foreground truncate">{item.patient}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <span className="text-[10px] text-muted-foreground">{item.bank}</span>
              <span className="text-xs font-semibold text-destructive">{formatCurrency(item.value)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExpenseCategories() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map((section) => (
          <ExpenseCard key={section.title} section={section} />
        ))}
      </div>
    </motion.div>
  );
}
