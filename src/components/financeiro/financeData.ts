// Mock data based on the clinic's real financial structure

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
  { name: "Dr Augusto", revenue: 89420.50, patients: 38, color: "hsl(168, 80%, 44%)" },
  { name: "Dr Celso", revenue: 28750.30, patients: 14, color: "hsl(190, 70%, 50%)" },
  { name: "Dr Marcus", revenue: 22680.15, patients: 11, color: "hsl(260, 60%, 55%)" },
  { name: "Dra Gisele", revenue: 18940.80, patients: 9, color: "hsl(32, 85%, 55%)" },
  { name: "Dra Vanessa", revenue: 15320.45, patients: 7, color: "hsl(350, 70%, 55%)" },
  { name: "Dra Kelly", revenue: 12450.20, patients: 6, color: "hsl(210, 80%, 55%)" },
];

export const patientsByDoctor: Record<string, { name: string; total: number; method: string }[]> = {
  "Dr Augusto": [
    { name: "Sandra Patricia de Castro", total: 1490.00, method: "Cartão Crédito" },
    { name: "Luisa Falcon", total: 1700.00, method: "Pix" },
    { name: "Diego Soares de Freitas", total: 1265.00, method: "Cartão Crédito" },
    { name: "Neide Gomes", total: 1280.00, method: "Pix" },
    { name: "Thaiane Anastacia", total: 1400.00, method: "Pix" },
    { name: "Luiz Fernando Costa", total: 1840.00, method: "Cartão Crédito" },
    { name: "Bruno Geronimo", total: 1200.00, method: "Pix" },
    { name: "Gustavo Mendonça Coimbra", total: 880.00, method: "Cartão Crédito" },
    { name: "Marcus Vinicius Alves Miranda", total: 800.00, method: "Pix" },
    { name: "Cristina Solange Alves", total: 880.00, method: "Cartão Crédito" },
  ],
  "Dr Celso": [
    { name: "Yonne Medeiros Luz", total: 1400.00, method: "Pix" },
    { name: "Priscila Karst", total: 543.60, method: "Cartão Crédito" },
    { name: "Patricia Leite", total: 1670.09, method: "Cartão Crédito" },
    { name: "Narayana Lindoso", total: 1125.00, method: "Pix" },
    { name: "Jandir Dias", total: 250.00, method: "Pix" },
  ],
  "Dr Marcus": [
    { name: "Ana Maria Conceição", total: 3200.00, method: "Pix" },
    { name: "Andre Luiz Percival", total: 100.00, method: "Pix" },
    { name: "Beatriz Ferreira Barros", total: 485.66, method: "Cartão Crédito" },
    { name: "Divina Teixeira", total: 848.16, method: "Cartão Crédito" },
    { name: "Ana Clara Coutinho", total: 1084.20, method: "Cartão Crédito" },
  ],
  "Dra Gisele": [
    { name: "Allan Paulo", total: 1232.65, method: "Cartão Crédito" },
    { name: "Katia Queiroz", total: 478.38, method: "Cartão Crédito" },
    { name: "Sheila Dias", total: 357.98, method: "Cartão Crédito" },
    { name: "Iraci Gomes", total: 439.25, method: "Cartão Crédito" },
    { name: "Carol Fussi", total: 1319.51, method: "Cartão Crédito" },
  ],
  "Dra Vanessa": [
    { name: "Maria Eduarda Ferreira", total: 1656.47, method: "Cartão Crédito" },
    { name: "Otavio Ataide", total: 486.85, method: "Cartão Crédito" },
    { name: "Glenda Reis", total: 281.44, method: "Cartão Crédito" },
  ],
  "Dra Kelly": [
    { name: "Roberta Simao", total: 280.00, method: "Pix" },
    { name: "Veronica Mota", total: 1450.00, method: "Pix" },
    { name: "Leandro Souza", total: 155.22, method: "Cartão Crédito" },
  ],
};

export const paymentMethods = [
  { name: "Cartão de Crédito", total: 98450.30, percentage: 47.2 },
  { name: "Pix", total: 72380.50, percentage: 34.7 },
  { name: "Cartão de Débito", total: 18920.15, percentage: 9.1 },
  { name: "Boleto", total: 14580.40, percentage: 7.0 },
  { name: "A pagar", total: 4200.00, percentage: 2.0 },
];

export const banks = [
  { name: "B16", entradas: 89420.50, saidas: 42380.20, saldo: 47040.30 },
  { name: "Sicoob", entradas: 52780.30, saidas: 21500.00, saldo: 31280.30 },
  { name: "Stone", entradas: 48320.15, saidas: 12640.80, saldo: 35679.35 },
  { name: "Pix", entradas: 18767.59, saidas: 0, saldo: 18767.59 },
];

export const expenses = {
  debitos: {
    total: 30869.25,
    items: [
      { desc: "Antecipação repasse", patient: "Dr. Augusto", value: 21000.00, bank: "Sicoob" },
      { desc: "Colegio Biel", patient: "Dr. Augusto", value: 3134.24, bank: "Stone" },
      { desc: "Colegio Malu", patient: "Dr. Augusto", value: 2598.44, bank: "Stone" },
      { desc: "Meta Monica", patient: "Dr. Augusto", value: 3000.00, bank: "B16" },
      { desc: "Condomínio", patient: "Dr. Augusto", value: 550.00, bank: "B16" },
      { desc: "Uber", patient: "Dr. Augusto", value: 153.57, bank: "B16" },
      { desc: "Boleto Alfa", patient: "Dra. Gisele", value: 1738.50, bank: "Stone" },
      { desc: "Meta Thamires", patient: "Dr. Celso", value: 280.00, bank: "B16" },
    ],
  },
  impostos: {
    total: 1284.94,
    items: [
      { desc: "ISS + IRPJ", patient: "", value: 526.00, bank: "B16" },
      { desc: "DAS Simples", patient: "", value: 393.74, bank: "B16" },
      { desc: "INSS", patient: "", value: 128.86, bank: "B16" },
      { desc: "Outros impostos", patient: "", value: 236.34, bank: "Sicoob" },
    ],
  },
  repasses: {
    total: 16356.21,
    items: [
      { desc: "Repasse Dr Celso", patient: "Dr Celso", value: 12471.05, bank: "B16" },
      { desc: "Repasse Dr Marcus", patient: "Dr Marcus", value: 2908.46, bank: "B16" },
      { desc: "Repasse Dra Kelly", patient: "Dra Kelly", value: 976.70, bank: "B16" },
    ],
  },
  fixas: {
    total: 20075.80,
    items: [
      { desc: "Aluguel", patient: "", value: 12089.26, bank: "B16" },
      { desc: "Salário Mônica", patient: "", value: 5000.00, bank: "B16" },
      { desc: "Salário Thamires", patient: "", value: 1860.58, bank: "B16" },
      { desc: "Estacionamento", patient: "", value: 480.00, bank: "B16" },
      { desc: "TV Doutor", patient: "", value: 206.96, bank: "Stone" },
      { desc: "Lins Ambiental", patient: "", value: 150.00, bank: "B16" },
      { desc: "Man. Polissonografia", patient: "", value: 289.00, bank: "B16" },
    ],
  },
  variaveis: {
    total: 8699.18,
    items: [
      { desc: "Formedica", patient: "", value: 5655.09, bank: "Stone" },
      { desc: "Central Farma", patient: "", value: 158.23, bank: "Stone" },
      { desc: "Formedica", patient: "", value: 2058.00, bank: "B16" },
      { desc: "Noripurum 10 caixas", patient: "", value: 765.40, bank: "B16" },
      { desc: "Material de Limpeza", patient: "", value: 62.46, bank: "B16" },
    ],
  },
};

export const transactions: Transaction[] = [
  { id: 1, date: "02/01", paymentDate: "02/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Wanderleia Camelo", bank: "B16", valueIn: 250.00, valueOut: 0, installments: 1, doctor: "Dr Augusto", category: "Consulta" },
  { id: 2, date: "02/01", paymentDate: "02/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Priscila Karst", bank: "B16", valueIn: 30.00, valueOut: 0, installments: 1, doctor: "Dr Celso", category: "Consulta" },
  { id: 3, date: "01/01", paymentDate: "01/01/2026", type: "saida", paymentMethod: "Pix", description: "Salário Mônica", patient: "", bank: "B16", valueIn: 0, valueOut: 5000.00, installments: 0, doctor: "", category: "Fixa" },
  { id: 4, date: "05/01", paymentDate: "05/01/2026", type: "saida", paymentMethod: "Boleto", description: "Aluguel", patient: "", bank: "B16", valueIn: 0, valueOut: 12089.26, installments: 0, doctor: "", category: "Fixa" },
  { id: 5, date: "05/01", paymentDate: "05/01/2026", type: "saida", paymentMethod: "Boleto", description: "Colegio Biel", patient: "", bank: "Stone", valueIn: 0, valueOut: 3134.24, installments: 0, doctor: "Dr Augusto", category: "Debito" },
  { id: 6, date: "05/01", paymentDate: "05/01/2026", type: "saida", paymentMethod: "Boleto", description: "Colegio Malu", patient: "", bank: "Stone", valueIn: 0, valueOut: 2598.44, installments: 0, doctor: "Dr Augusto", category: "Debito" },
  { id: 7, date: "05/01", paymentDate: "05/01/2026", type: "saida", paymentMethod: "Pix", description: "Repasse Dr Celso", patient: "", bank: "B16", valueIn: 0, valueOut: 12471.05, installments: 0, doctor: "Dr Celso", category: "Repasse" },
  { id: 8, date: "05/01", paymentDate: "05/01/2026", type: "saida", paymentMethod: "Boleto", description: "TV Doutor", patient: "", bank: "Stone", valueIn: 0, valueOut: 206.96, installments: 0, doctor: "", category: "Fixa" },
  { id: 9, date: "05/01", paymentDate: "05/01/2026", type: "saida", paymentMethod: "Boleto", description: "Boleto Alfa", patient: "", bank: "Stone", valueIn: 0, valueOut: 1738.50, installments: 0, doctor: "Dra Gisele", category: "Debito" },
  { id: 10, date: "06/01", paymentDate: "06/01/2026", type: "saida", paymentMethod: "Boleto", description: "Formedica", patient: "", bank: "Stone", valueIn: 0, valueOut: 5655.09, installments: 0, doctor: "", category: "Variável" },
  { id: 11, date: "06/01", paymentDate: "06/01/2026", type: "saida", paymentMethod: "Pix", description: "Antecipação repasse", patient: "", bank: "Sicoob", valueIn: 0, valueOut: 11000.00, installments: 0, doctor: "Dr Augusto", category: "Debito" },
  { id: 12, date: "07/01", paymentDate: "07/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Roberta Simao", bank: "B16", valueIn: 280.00, valueOut: 0, installments: 1, doctor: "Dra Kelly", category: "Consulta" },
  { id: 13, date: "07/01", paymentDate: "07/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Vanivia Gomes", bank: "B16", valueIn: 150.00, valueOut: 0, installments: 1, doctor: "Dr Augusto", category: "Consulta" },
  { id: 14, date: "07/01", paymentDate: "07/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Sandra Patricia de Castro", bank: "B16", valueIn: 840.00, valueOut: 0, installments: 1, doctor: "Dr Augusto", category: "Consulta" },
  { id: 15, date: "08/01", paymentDate: "08/01/2026", type: "saida", paymentMethod: "Pix", description: "Antecipação repasse", patient: "", bank: "Sicoob", valueIn: 0, valueOut: 10000.00, installments: 0, doctor: "Dr Augusto", category: "Debito" },
  { id: 16, date: "08/01", paymentDate: "08/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Beatriz Ferreira Barros", bank: "B16", valueIn: 290.00, valueOut: 0, installments: 1, doctor: "Dr Marcus", category: "Consulta" },
  { id: 17, date: "09/01", paymentDate: "09/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Neide Gomes", bank: "B16", valueIn: 1280.00, valueOut: 0, installments: 1, doctor: "Dr Augusto", category: "Consulta" },
  { id: 18, date: "09/01", paymentDate: "09/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Thaiane Anastacia", bank: "B16", valueIn: 1400.00, valueOut: 0, installments: 1, doctor: "Dr Augusto", category: "Consulta" },
  { id: 19, date: "09/01", paymentDate: "09/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Yonne Medeiros Luz", bank: "B16", valueIn: 1400.00, valueOut: 0, installments: 1, doctor: "Dr Celso", category: "Consulta" },
  { id: 20, date: "09/01", paymentDate: "09/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Luiz Fernando Costa", bank: "B16", valueIn: 1400.00, valueOut: 0, installments: 1, doctor: "Dr Augusto", category: "Consulta" },
  { id: 21, date: "09/01", paymentDate: "09/01/2026", type: "saida", paymentMethod: "Pix", description: "Repasse Dr Marcus", patient: "", bank: "B16", valueIn: 0, valueOut: 2908.46, installments: 0, doctor: "Dr Marcus", category: "Repasse" },
  { id: 22, date: "12/01", paymentDate: "12/01/2026", type: "saida", paymentMethod: "Pix", description: "Meta Monica", patient: "", bank: "B16", valueIn: 0, valueOut: 3000.00, installments: 0, doctor: "Dr Augusto", category: "Debito" },
  { id: 23, date: "12/01", paymentDate: "12/01/2026", type: "saida", paymentMethod: "Pix", description: "Repasse Dra Kelly", patient: "", bank: "B16", valueIn: 0, valueOut: 976.70, installments: 0, doctor: "Dra Kelly", category: "Repasse" },
  { id: 24, date: "12/01", paymentDate: "12/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Bruno Geronimo", bank: "B16", valueIn: 1200.00, valueOut: 0, installments: 1, doctor: "Dr Augusto", category: "Consulta" },
  { id: 25, date: "15/01", paymentDate: "15/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Andre Luiz Percival", bank: "B16", valueIn: 100.00, valueOut: 0, installments: 1, doctor: "Dr Marcus", category: "Consulta" },
  { id: 26, date: "15/01", paymentDate: "15/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Natalia Oliveira Vieira", bank: "B16", valueIn: 1400.00, valueOut: 0, installments: 1, doctor: "Dr Augusto", category: "Consulta" },
  { id: 27, date: "15/01", paymentDate: "15/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Ana Maria Conceição", bank: "B16", valueIn: 3200.00, valueOut: 0, installments: 1, doctor: "Dr Marcus", category: "Consulta" },
  { id: 28, date: "15/01", paymentDate: "15/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Veronica Mota", bank: "B16", valueIn: 1450.00, valueOut: 0, installments: 1, doctor: "Dra Kelly", category: "Consulta" },
  { id: 29, date: "15/01", paymentDate: "15/01/2026", type: "entrada", paymentMethod: "Pix", description: "Consulta", patient: "Narayana Lindoso", bank: "B16", valueIn: 1125.00, valueOut: 0, installments: 1, doctor: "Dr Celso", category: "Consulta" },
  { id: 30, date: "01/01", paymentDate: "01/01/2026", type: "saida", paymentMethod: "Pix", description: "Salário Thamires", patient: "", bank: "B16", valueIn: 0, valueOut: 1860.58, installments: 0, doctor: "", category: "Fixa" },
];

export const totalEntradas = 209288.54;
export const totalSaidas = 135571.43;
export const saldo = 73717.11;
export const totalTransacoes = transactions.length;
export const totalMedicos = doctors.length;
export const totalPacientes = 85;

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
