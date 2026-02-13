import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { FinanceKPIs } from "@/components/financeiro/FinanceKPIs";
import { DoctorRevenue } from "@/components/financeiro/DoctorRevenue";
import { PatientsList } from "@/components/financeiro/PatientsList";
import { PaymentMethods } from "@/components/financeiro/PaymentMethods";
import { BankAccounts } from "@/components/financeiro/BankAccounts";
import { ExpenseCategories } from "@/components/financeiro/ExpenseCategories";
import { FinanceCharts } from "@/components/financeiro/FinanceCharts";
import { TransactionsTable } from "@/components/financeiro/TransactionsTable";
import { motion } from "framer-motion";

const Financeiro = () => {
  return (
    <AppLayout>
      <TopBar title="Financeiro" subtitle="Controle financeiro completo da clínica" />
      <div className="p-6 space-y-6">
        <FinanceKPIs />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <DoctorRevenue />
          <PatientsList />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PaymentMethods />
          <BankAccounts />
        </div>

        <ExpenseCategories />
        <FinanceCharts />
        <TransactionsTable />
      </div>
    </AppLayout>
  );
};

export default Financeiro;
