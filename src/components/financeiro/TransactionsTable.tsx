import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { formatCurrency } from "./financeData";
import { useFinanceData } from "@/hooks/useFinanceData";
import { cn } from "@/lib/utils";
import { Shield, Sparkles } from "lucide-react";

export function TransactionsTable() {
  const { transactions, doctors, bankAccounts, isLoading } = useFinanceData();
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterBank, setFilterBank] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSource, setFilterSource] = useState("");

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (filterDoctor) result = result.filter(t => t.doctor === filterDoctor);
    if (filterBank) result = result.filter(t => t.bank === filterBank);
    if (filterType === "entrada") result = result.filter(t => t.type === "entrada");
    if (filterType === "saida") result = result.filter(t => t.type === "saida");
    if (filterSource) result = result.filter(t => t.source === filterSource);
    return result;
  }, [transactions, filterDoctor, filterBank, filterType, filterSource]);

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
          <h3 className="font-display font-semibold text-foreground">📋 Movimentações Consolidadas</h3>
          <p className="text-sm text-muted-foreground">{filtered.length} registros (Clínica + Analyst AI)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)} className={selectClass}>
          <option value="">Todos Médicos</option>
          {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
        <select value={filterBank} onChange={e => setFilterBank(e.target.value)} className={selectClass}>
          <option value="">Todos Bancos</option>
          {bankAccounts.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectClass}>
          <option value="">Tipos</option>
          <option value="entrada">Entradas</option>
          <option value="saida">Saídas</option>
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className={selectClass}>
          <option value="">Origem (Todas)</option>
          <option value="transaction">Sistema Clínica</option>
          <option value="gasto">Analyst AI</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border/30">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Data</th>
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Descrição</th>
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Origem</th>
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Médico / Paciente</th>
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Banco</th>
              <th className="text-right py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Entrada</th>
              <th className="text-right py-3 px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Saída</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground italic">Nenhum registro encontrado.</td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={`${t.source}-${t.id}`} className="border-t border-border/20 hover:bg-primary/5 transition-colors">
                  <td className="py-2.5 px-4 text-xs text-muted-foreground font-mono">{t.date}</td>
                  <td className="py-2.5 px-4">
                    <div className="text-xs text-foreground font-medium truncate max-w-[200px]" title={t.description}>
                      {t.description}
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    {t.source === "transaction" ? (
                      <span className="flex items-center gap-1 text-[10px] text-info/80 font-medium">
                        <Shield className="w-3 h-3" /> Clínica
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-primary/80 font-medium">
                        <Sparkles className="w-3 h-3" /> Analyst AI
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex flex-col gap-0.5">
                      {t.doctor && <span className="text-[10px] font-medium text-primary">Dr(a). {t.doctor}</span>}
                      {t.patient && <span className="text-[10px] text-muted-foreground truncate font-mono">P: {t.patient}</span>}
                      {!t.doctor && !t.patient && <span className="text-[10px] text-muted-foreground">-</span>}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-xs text-muted-foreground">{t.bank}</td>
                  <td className="py-2.5 px-4 text-right text-xs font-bold text-success">
                    {t.valueIn > 0 ? formatCurrency(t.valueIn) : "-"}
                  </td>
                  <td className="py-2.5 px-4 text-right text-xs font-bold text-destructive">
                    {t.valueOut > 0 ? formatCurrency(t.valueOut) : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
