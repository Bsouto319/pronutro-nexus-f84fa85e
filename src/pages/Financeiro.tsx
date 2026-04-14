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
import { AICapture } from "@/components/financeiro/AICapture";
import { FinanceExport } from "@/components/financeiro/FinanceExport";
import { FinanceImport } from "@/components/financeiro/FinanceImport";
import { AddTransactionDialog } from "@/components/financeiro/AddTransactionDialog";
import { ClearAllFinanceDialog } from "@/components/financeiro/ClearAllFinanceDialog";
import { PeriodFilter, PeriodRange } from "@/components/financeiro/PeriodFilter";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useState } from "react";

const Financeiro = () => {
  const { refetch } = useFinanceData();
  const [period, setPeriod] = useState<PeriodRange>(null);

  return (
    <AppLayout>
      <TopBar title="Financeiro" subtitle="Controle financeiro completo da clínica" onRefresh={refetch} />
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-wrap gap-3 items-center">
          <AddTransactionDialog />
          <ClearAllFinanceDialog />
        </div>

        <PeriodFilter value={period} onChange={setPeriod} />

        <AICapture />
        <FinanceImport />
        <FinanceExport />
        <FinanceKPIs period={period} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DoctorRevenue />
          <PatientsList />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PaymentMethods />
          <BankAccounts />
        </div>

        <ExpenseCategories />

        <div className="grid grid-cols-1 gap-6">
          <FinanceCharts />
          <TransactionsTable period={period} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Financeiro;
