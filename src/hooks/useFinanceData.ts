import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

const DEFAULT_ORG_ID = "65777d18-1126-481d-93d9-169237388d7f";

export interface GastoRow {
  id: string;
  organization_id: string;
  descricao: string;
  valor: number;
  categoria: string;
  fornecedor: string | null;
  metodo_pagamento: string | null;
  data_gasto: string;
  created_at: string;
}

export function useFinanceData() {
  const gastosQuery = useQuery({
    queryKey: ["gastos", DEFAULT_ORG_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gastos" as any)
        .select("*")
        .eq("organization_id", DEFAULT_ORG_ID)
        .order("data_gasto", { ascending: false });

      if (error) {
        console.warn("Error fetching gastos:", error.message);
        return [] as GastoRow[];
      }
      return (data || []) as unknown as GastoRow[];
    },
  });

  const doctorsQuery = useQuery({
    queryKey: ["clinic_doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_doctors")
        .select("*");
      if (error) {
        console.warn("Error fetching doctors:", error.message);
        return [];
      }
      return data || [];
    },
  });

  const bankAccountsQuery = useQuery({
    queryKey: ["bank_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*");
      if (error) {
        console.warn("Error fetching bank accounts:", error.message);
        return [];
      }
      return data || [];
    },
  });

  const patientsQuery = useQuery({
    queryKey: ["clinic_patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_patients")
        .select("*");
      if (error) {
        console.warn("Error fetching patients:", error.message);
        return [];
      }
      return data || [];
    },
  });

  const rawGastos = gastosQuery.data || [];

  const transactions = useMemo(() => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return "";
      if (dateStr.includes("/")) return dateStr;
      try {
        const d = new Date(dateStr);
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      } catch {
        return dateStr;
      }
    };

    return rawGastos.map((g) => ({
      id: g.id,
      date: formatDate(g.data_gasto || g.created_at || ""),
      description: g.descricao || "Gasto IA",
      doctor: null as string | null,
      patient: null as string | null,
      paymentMethod: g.metodo_pagamento || "N/A",
      bank: "Geral",
      category: g.categoria || "outros",
      valueIn: 0,
      valueOut: g.valor || 0,
      type: "saida" as const,
      source: "gasto" as const,
      fornecedor: g.fornecedor,
    }));
  }, [rawGastos]);

  const doctors = doctorsQuery.data || [];
  const bankAccounts = bankAccountsQuery.data || [];

  const isLoading = gastosQuery.isLoading || doctorsQuery.isLoading || bankAccountsQuery.isLoading || patientsQuery.isLoading;
  const isError = gastosQuery.isError || doctorsQuery.isError || bankAccountsQuery.isError || patientsQuery.isError;

  const totalSaidas = transactions.reduce((acc, t) => acc + (t.valueOut || 0), 0);
  const totalEntradas = 0; // No income source yet
  const saldo = totalEntradas - totalSaidas;

  return {
    transactions,
    gastos: rawGastos,
    doctors,
    bankAccounts,
    patients: patientsQuery.data || [],
    kpis: {
      totalEntradas,
      totalSaidas,
      saldo,
      totalTransacoes: transactions.length,
      totalMedicos: doctors.length,
      totalPacientes: (patientsQuery.data || []).length,
    },
    isLoading,
    isError,
    refetch: () => {
      gastosQuery.refetch();
      doctorsQuery.refetch();
      bankAccountsQuery.refetch();
      patientsQuery.refetch();
    },
  };
}
