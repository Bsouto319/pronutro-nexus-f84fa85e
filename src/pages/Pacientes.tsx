import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { Users, Search, Plus, Filter } from "lucide-react";
import { useFinanceData } from "@/hooks/useFinanceData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion } from "framer-motion";

const Pacientes = () => {
  const { patients, doctors, isLoading } = useFinanceData();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDoctorName = (doctorId: string | null) => {
    if (!doctorId) return "Não atribuído";
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : "Não encontrado";
  };

  return (
    <AppLayout>
      <TopBar title="Gestão de Pacientes" subtitle="Base de dados completa da clínica" />
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Pacientes</h1>
              <p className="text-sm text-muted-foreground">{patients.length} pacientes cadastrados</p>
            </div>
          </div>
          <Button className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Novo Paciente
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center mb-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              className="pl-10 glass"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="glass w-full md:w-auto">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        <div className="glass rounded-xl overflow-hidden border border-border/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paciente</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Médico Responsável</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Método de Pgto</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Investido</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">Carregando pacientes...</td>
                  </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum paciente encontrado.</td>
                  </tr>
                ) : (
                  filteredPatients.map((patient, i) => (
                    <motion.tr
                      key={patient.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-4 font-medium text-foreground">{patient.name}</td>
                      <td className="p-4 text-sm text-muted-foreground">{getDoctorName(patient.doctor_id)}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase ring-1 ring-primary/20">
                          {patient.payment_method || "N/A"}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-semibold text-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patient.total || 0)}
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-primary hover:text-primary/80 transition-colors text-sm font-medium">Ver Detalhes</button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Pacientes;
