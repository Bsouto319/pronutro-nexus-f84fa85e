import { motion } from "framer-motion";

const doctors = [
  { name: "Dr. Augusto Margon", specialty: "Nutrólogo, Psiquiatra e Intensivista", patients: 124, rating: 5.0, avatar: "AM", price: "R$ 930" },
  { name: "Dr. Celso Melo", specialty: "Nutrólogo e Cirurgião Proctologista", patients: 89, rating: 4.9, avatar: "CM", price: "R$ 650" },
  { name: "Dr. Marcus Gesteira", specialty: "Emagrecimento (Atende Convênios)", patients: 156, rating: 4.8, avatar: "MG", price: "R$ 560" },
  { name: "Dra. Vanessa Melo", specialty: "Pediatra e Nutrologia (Convênios)", patients: 142, rating: 4.9, avatar: "VM", price: "R$ 560" },
  { name: "Dra. Kelly Felippes", specialty: "Saúde e Fertilidade da Mulher", patients: 95, rating: 4.9, avatar: "KF", price: "R$ 500" },
  { name: "Gisele Falcão", specialty: "Enfermeira Esteta", patients: 78, rating: 4.8, avatar: "GF", price: "R$ 200 (Aval.)" },
];

const colors = [
  "from-primary to-info",
  "from-chart-3 to-primary",
  "from-chart-4 to-chart-5",
  "from-info to-chart-3",
  "from-primary to-chart-2",
  "from-chart-5 to-chart-4",
];

export function DoctorsGrid() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="glass rounded-xl p-6 card-shadow"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-semibold text-foreground">Equipe Médica</h3>
          <p className="text-sm text-muted-foreground">6 profissionais ativos</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {doctors.map((doc, i) => (
          <motion.div
            key={doc.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.05 }}
            className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200 cursor-pointer group"
          >
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors[i]} flex items-center justify-center mb-3`}>
              <span className="text-xs font-bold text-primary-foreground">{doc.avatar}</span>
            </div>
            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
              {doc.name}
            </p>
            <p className="text-xs text-muted-foreground mb-2 truncate">{doc.specialty}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{doc.patients} pacientes</span>
              <span className="text-warning">★ {doc.rating}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
