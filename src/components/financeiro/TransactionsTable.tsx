import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { transactions, doctors, banks, formatCurrency } from "./financeData";
import { cn } from "@/lib/utils";

export function TransactionsTable() {
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterBank, setFilterBank] = useState("");
  const [filterType, setFilterType] = useState("");

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (filterDoctor) result = result.filter(t => t.doctor === filterDoctor);
    if (filterBank) result = result.filter(t => t.bank === filterBank);
    if (filterType === "entrada") result = result.filter(t => t.type === "entrada");
    if (filterType === "saida") result = result.filter(t => t.type === "saida");
    return result;
  }, [filterDoctor, filterBank, filterType]);

  const selectClass = "bg-muted border border-border text-foreground px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/50";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="glass rounded-xl p-6 card-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-foreground">📋 Transações</h3>
          <p className="text-sm text-muted-foreground">{filtered.length} registros</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)} className={selectClass}>
          <option value="">Todos Médicos</option>
          {doctors.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
        </select>
        <select value={filterBank} onChange={e => setFilterBank(e.target.value)} className={selectClass}>
          <option value="">Todos Bancos</option>
          {banks.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectClass}>
          <option value="">Todas</option>
          <option value="entrada">Entradas</option>
          <option value="saida">Saídas</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border/30">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Data</th>
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Descrição</th>
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Médico</th>
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Paciente</th>
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Forma Pgto</th>
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Banco</th>
              <th className="text-right py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Entrada</th>
              <th className="text-right py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Saída</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-t border-border/20 hover:bg-primary/5 transition-colors">
                <td className="py-2.5 px-4 text-xs text-muted-foreground">{t.date}</td>
                <td className="py-2.5 px-4 text-xs text-foreground font-medium">{t.description}</td>
                <td className="py-2.5 px-4">
                  {t.doctor ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {t.doctor}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Geral</span>
                  )}
                </td>
                <td className="py-2.5 px-4">
                  {t.patient ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-chart-3/10 text-chart-3 truncate max-w-[150px] inline-block">
                      {t.patient}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
                <td className="py-2.5 px-4 text-xs text-muted-foreground">{t.paymentMethod}</td>
                <td className="py-2.5 px-4 text-xs text-muted-foreground">{t.bank}</td>
                <td className="py-2.5 px-4 text-right text-xs font-semibold text-success">
                  {t.valueIn > 0 ? formatCurrency(t.valueIn) : "-"}
                </td>
                <td className="py-2.5 px-4 text-right text-xs font-semibold text-destructive">
                  {t.valueOut > 0 ? formatCurrency(t.valueOut) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
