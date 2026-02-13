import { motion } from "framer-motion";
import { useState } from "react";
import { doctors, patientsByDoctor, formatCurrency } from "./financeData";
import { cn } from "@/lib/utils";

export function PatientsList() {
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0].name);
  const patients = patientsByDoctor[selectedDoctor] || [];

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
          <p className="text-sm text-muted-foreground">{patients.length} pacientes</p>
        </div>
      </div>

      {/* Doctor tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-thin">
        {doctors.map((doc) => (
          <button
            key={doc.name}
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
      <div className="space-y-1 max-h-[320px] overflow-y-auto">
        {patients.map((patient, i) => (
          <motion.div
            key={patient.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors text-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate">{patient.name}</p>
              <p className="text-xs text-muted-foreground">{patient.method}</p>
            </div>
            <span className="text-info font-semibold ml-2 flex-shrink-0">{formatCurrency(patient.total)}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
