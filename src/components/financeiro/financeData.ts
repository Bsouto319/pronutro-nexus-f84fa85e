// Demo data - fictional placeholder data for development purposes

export interface Transaction {
  id: number;
  date: string;
  paymentDate: string;
  type: "entrada" | "saida";
  paymentMethod: string;
  description: string;
  patient: string;
  bank: string;
  valueIn: number;
  valueOut: number;
  installments: number;
  doctor: string;
  category: string;
}

export const doctors = [
  { name: "Dr. Silva", revenue: 45200.00, patients: 22, color: "hsl(168, 80%, 44%)" },
  { name: "Dr. Costa", revenue: 18500.00, patients: 10, color: "hsl(190, 70%, 50%)" },
  { name: "Dr. Lima", revenue: 15300.00, patients: 8, color: "hsl(260, 60%, 55%)" },
  { name: "Dra. Almeida", revenue: 12800.00, patients: 6, color: "hsl(32, 85%, 55%)" },
  { name: "Dra. Ferreira", revenue: 9600.00, patients: 5, color: "hsl(350, 70%, 55%)" },
  { name: "Dra. Rocha", revenue: 7400.00, patients: 4, color: "hsl(210, 80%, 55%)" },
];

export const patientsByDoctor: Record<string, { name: string; total: number; method: string }[]> = {
  "Dr. Silva": [
    { name: "Paciente A1", total: 1490.00, method: "Cartão Crédito" },
    { name: "Paciente A2", total: 1700.00, method: "Pix" },
    { name: "Paciente A3", total: 1265.00, method: "Cartão Crédito" },
    { name: "Paciente A4", total: 1280.00, method: "Pix" },
    { name: "Paciente A5", total: 1400.00, method: "Pix" },
  ],
  "Dr. Costa": [
    { name: "Paciente B1", total: 1400.00, method: "Pix" },
    { name: "Paciente B2", total: 543.60, method: "Cartão Crédito" },
    { name: "Paciente B3", total: 1670.00, method: "Cartão Crédito" },
  ],
  "Dr. Lima": [
    { name: "Paciente C1", total: 3200.00, method: "Pix" },
    { name: "Paciente C2", total: 485.00, method: "Cartão Crédito" },
    { name: "Paciente C3", total: 848.00, method: "Cartão Crédito" },
  ],
  "Dra. Almeida": [
    { name: "Paciente D1", total: 1232.00, method: "Cartão Crédito" },
    { name: "Paciente D2", total: 478.00, method: "Cartão Crédito" },
  ],
  "Dra. Ferreira": [
    { name: "Paciente E1", total: 1656.00, method: "Cartão Crédito" },
    { name: "Paciente E2", total: 486.00, method: "Cartão Crédito" },
  ],
  "Dra. Rocha": [
    { name: "Paciente F1", total: 280.00, method: "Pix" },
    { name: "Paciente F2", total: 1450.00, method: "Pix" },
  ],
};

export const paymentMethods = [
  { name: "Cartão de Crédito", total: 52000.00, percentage: 47.2 },
  { name: "Pix", total: 38200.00, percentage: 34.7 },
  { name: "Cartão de Débito", total: 10000.00, percentage: 9.1 },
  { name: "Boleto", total: 7700.00, percentage: 7.0 },
  { name: "A pagar", total: 2200.00, percentage: 2.0 },
];

export const banks = [
  { name: "Banco A", entradas: 45000.00, saidas: 22000.00, saldo: 23000.00 },
  { name: "Banco B", entradas: 28000.00, saidas: 11000.00, saldo: 17000.00 },
  { name: "Banco C", entradas: 25000.00, saidas: 6500.00, saldo: 18500.00 },
  { name: "Pix", entradas: 12000.00, saidas: 0, saldo: 12000.00 },
];

export const expenses = {
  debitos: {
    total: 15000.00,
    items: [
      { desc: "Antecipação repasse", patient: "Dr. Silva", value: 10000.00, bank: "Banco B" },
      { desc: "Despesa operacional", patient: "Dr. Silva", value: 3000.00, bank: "Banco C" },
      { desc: "Despesa administrativa", patient: "Dr. Silva", value: 2000.00, bank: "Banco A" },
    ],
  },
  impostos: {
    total: 1200.00,
    items: [
      { desc: "ISS + IRPJ", patient: "", value: 500.00, bank: "Banco A" },
      { desc: "DAS Simples", patient: "", value: 400.00, bank: "Banco A" },
      { desc: "INSS", patient: "", value: 130.00, bank: "Banco A" },
      { desc: "Outros impostos", patient: "", value: 170.00, bank: "Banco B" },
    ],
  },
  repasses: {
    total: 8500.00,
    items: [
      { desc: "Repasse Dr. Costa", patient: "Dr. Costa", value: 5000.00, bank: "Banco A" },
      { desc: "Repasse Dr. Lima", patient: "Dr. Lima", value: 2500.00, bank: "Banco A" },
      { desc: "Repasse Dra. Rocha", patient: "Dra. Rocha", value: 1000.00, bank: "Banco A" },
    ],
  },
  fixas: {
    total: 12000.00,
    items: [
      { desc: "Aluguel", patient: "", value: 7000.00, bank: "Banco A" },
      { desc: "Salário Recepção", patient: "", value: 3000.00, bank: "Banco A" },
      { desc: "Salário Auxiliar", patient: "", value: 1500.00, bank: "Banco A" },
      { desc: "Estacionamento", patient: "", value: 500.00, bank: "Banco A" },
    ],
  },
  variaveis: {
    total: 5000.00,
    items: [
      { desc: "Fornecedor A", patient: "", value: 3000.00, bank: "Banco C" },
      { desc: "Fornecedor B", patient: "", value: 1200.00, bank: "Banco A" },
      { desc: "Material de Limpeza", patient: "", value: 800.00, bank: "Banco A" },
    ],
  },
};

export const transactions: Transaction[] = [
  { id: 1, date: "02/01", paymentDate: "02/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Paciente A1", bank: "Banco A", valueIn: 250.00, valueOut: 0, installments: 1, doctor: "Dr. Silva", category: "Consulta" },
  { id: 2, date: "02/01", paymentDate: "02/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Paciente B1", bank: "Banco A", valueIn: 30.00, valueOut: 0, installments: 1, doctor: "Dr. Costa", category: "Consulta" },
  { id: 3, date: "01/01", paymentDate: "01/01/2026", type: "saida", paymentMethod: "Pix", description: "Salário Recepção", patient: "", bank: "Banco A", valueIn: 0, valueOut: 3000.00, installments: 0, doctor: "", category: "Fixa" },
  { id: 4, date: "05/01", paymentDate: "05/01/2026", type: "saida", paymentMethod: "Boleto", description: "Aluguel", patient: "", bank: "Banco A", valueIn: 0, valueOut: 7000.00, installments: 0, doctor: "", category: "Fixa" },
  { id: 5, date: "05/01", paymentDate: "05/01/2026", type: "saida", paymentMethod: "Pix", description: "Repasse Dr. Costa", patient: "", bank: "Banco A", valueIn: 0, valueOut: 5000.00, installments: 0, doctor: "Dr. Costa", category: "Repasse" },
  { id: 6, date: "07/01", paymentDate: "07/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Paciente F1", bank: "Banco A", valueIn: 280.00, valueOut: 0, installments: 1, doctor: "Dra. Rocha", category: "Consulta" },
  { id: 7, date: "07/01", paymentDate: "07/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Paciente A2", bank: "Banco A", valueIn: 1700.00, valueOut: 0, installments: 1, doctor: "Dr. Silva", category: "Consulta" },
  { id: 8, date: "09/01", paymentDate: "09/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Paciente A4", bank: "Banco A", valueIn: 1280.00, valueOut: 0, installments: 1, doctor: "Dr. Silva", category: "Consulta" },
  { id: 9, date: "09/01", paymentDate: "09/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Paciente B1", bank: "Banco A", valueIn: 1400.00, valueOut: 0, installments: 1, doctor: "Dr. Costa", category: "Consulta" },
  { id: 10, date: "12/01", paymentDate: "12/01/2026", type: "saida", paymentMethod: "Pix", description: "Repasse Dra. Rocha", patient: "", bank: "Banco A", valueIn: 0, valueOut: 1000.00, installments: 0, doctor: "Dra. Rocha", category: "Repasse" },
  { id: 11, date: "15/01", paymentDate: "15/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Paciente C1", bank: "Banco A", valueIn: 3200.00, valueOut: 0, installments: 1, doctor: "Dr. Lima", category: "Consulta" },
  { id: 12, date: "15/01", paymentDate: "15/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Paciente F2", bank: "Banco A", valueIn: 1450.00, valueOut: 0, installments: 1, doctor: "Dra. Rocha", category: "Consulta" },
];

export const totalEntradas = 110100.00;
export const totalSaidas = 41700.00;
export const saldo = 68400.00;
export const totalTransacoes = transactions.length;
export const totalMedicos = doctors.length;
export const totalPacientes = 55;

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
