import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { formatCurrency } from "./financeData";
import { cn } from "@/lib/utils";
import { useFinanceData } from "@/hooks/useFinanceData";

export function PatientsList() {
  const { doctors, transactions, isLoading } = useFinanceData();
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");

  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctor) {
      setSelectedDoctor(doctors[0].name);
    }
  }, [doctors, selectedDoctor]);

  const patients = useMemo(() => {
    if (!selectedDoctor) return [];

    // Group transactions by patient for the selected doctor
    const patientMap = new Map<string, { name: string; total: number; method: string }>();

    transactions
      .filter(t => t.doctor === selectedDoctor && t.patient)
      .forEach(t => {
        const current = patientMap.get(t.patient!) || { name: t.patient!, total: 0, method: t.paymentMethod || "N/A" };
        current.total += (t.valueIn || 0);
        patientMap.set(t.patient!, current);
      });

    return Array.from(patientMap.values()).sort((a, b) => b.total - a.total);
  }, [selectedDoctor, transactions]);

  if (isLoading) return <div className="glass rounded-xl p-12 animate-pulse bg-muted/20" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
      className="glass rounded-xl p-6 card-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-foreground">👤 Pacientes por Médico</h3>
          <p className="text-sm text-muted-foreground">{patients.length} pacientes atendidos</p>
        </div>
      </div>

      {/* Doctor tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-thin">
        {doctors.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setSelectedDoctor(doc.name)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              selectedDoctor === doc.name
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {doc.name}
          </button>
        ))}
      </div>

      {/* Patient list */}
      <div className="space-y-1 max-h-[320px] overflow-y-auto custom-scrollbar">
        {patients.length === 0 ? (
          <p className="text-center py-8 text-sm text-muted-foreground italic">Nenhum paciente encontrado para este médico.</p>
        ) : (
          patients.map((patient, i) => (
            <motion.div
              key={patient.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate font-medium">{patient.name}</p>
                <p className="text-xs text-muted-foreground">{patient.method}</p>
              </div>
              <span className="text-info font-semibold ml-2 flex-shrink-0">{formatCurrency(patient.total)}</span>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
