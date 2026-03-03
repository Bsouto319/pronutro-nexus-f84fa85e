import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export function useFinanceData() {
    const transactionsQuery = useQuery({
        queryKey: ["financial_transactions"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("financial_transactions")
                .select("*")
                .order("date", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const doctorsQuery = useQuery({
        queryKey: ["clinic_doctors"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("clinic_doctors")
                .select("*");

            if (error) throw error;
            return data;
        },
    });

    const bankAccountsQuery = useQuery({
        queryKey: ["bank_accounts"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("bank_accounts")
                .select("*");

            if (error) throw error;
            return data;
        },
    });

    const patientsQuery = useQuery({
        queryKey: ["clinic_patients"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("clinic_patients")
                .select("*");

            if (error) throw error;
            return data;
        },
    });

    const gastosQuery = useQuery({
        queryKey: ["gastos"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("gastos")
                .select("*")
                .order("data_gasto", { ascending: false });

            if (error) {
                console.warn("Table 'gastos' might not exist yet:", error.message);
                return [];
            }
            return data;
        },
    });

    const bankAccounts = useMemo(() => {
        const rawAccounts = bankAccountsQuery.data || [];
        return rawAccounts.map(bank => {
            const bankTransactions = transactions.filter(t => t.bank === bank.name);
            const entradas = bankTransactions
                .filter(t => t.type === "entrada")
                .reduce((acc, t) => acc + (t.valueIn || 0), 0);
            const saidas = bankTransactions
                .filter(t => t.type === "saida")
                .reduce((acc, t) => acc + (t.valueOut || 0), 0);

            // If the DB already has a value and it's greater than 0, maybe use it? 
            // Better to stay consistent with transactions.
            return {
                ...bank,
                entradas: entradas || bank.entradas || 0,
                saidas: saidas || bank.saidas || 0,
                saldo: (bank.saldo || 0) + (entradas - saidas) // Assuming saldo in DB might be initial balance? Or just let it be calculated.
            };
        });
    }, [bankAccountsQuery.data, transactions]);

    const isLoading = transactionsQuery.isLoading || doctorsQuery.isLoading || bankAccountsQuery.isLoading || patientsQuery.isLoading || gastosQuery.isLoading;
    const isError = transactionsQuery.isError || doctorsQuery.isError || bankAccountsQuery.isError || patientsQuery.isError;

    const rawTransactions = transactionsQuery.data || [];
    const rawGastos = gastosQuery.data || [];

    const transactions = useMemo(() => {
        const formatDate = (dateStr: string) => {
            if (!dateStr) return "";
            if (dateStr.includes("/")) return dateStr; // Already DD/MM
            try {
                const d = new Date(dateStr);
                return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
            } catch (e) {
                return dateStr;
            }
        };

        const mappedTransactions = rawTransactions.map(t => ({
            id: t.id,
            date: formatDate(t.date || ""),
            description: t.description || "Sem descrição",
            doctor: t.doctor,
            patient: t.patient,
            paymentMethod: t.payment_method,
            bank: t.bank,
            valueIn: t.value_in || 0,
            valueOut: t.value_out || 0,
            type: t.type as "entrada" | "saida",
            source: "transaction" as const
        }));

        const mappedGastos = rawGastos.map(g => ({
            id: g.id,
            date: formatDate(g.data_gasto || g.created_at || ""),
            description: g.descricao || "Gasto IA",
            doctor: null,
            patient: null,
            paymentMethod: "N/A",
            bank: "Geral",
            valueIn: 0,
            valueOut: g.valor || 0,
            type: "saida" as const,
            source: "gasto" as const
        }));

        return [...mappedTransactions, ...mappedGastos].sort((a, b) => {
            const dateA = a.date.split("/").reverse().join("-");
            const dateB = b.date.split("/").reverse().join("-");
            return dateB.localeCompare(dateA);
        });
    }, [rawTransactions, rawGastos]);

    const doctors = useMemo(() => {
        const rawDocs = doctorsQuery.data || [];
        return rawDocs.map(doc => {
            const docTransactions = transactions.filter(t => t.doctor === doc.name && t.source === "transaction");
            const revenue = docTransactions.reduce((acc, t) => acc + (t.valueIn || 0), 0);
            const patientsCount = new Set(docTransactions.map(t => t.patient).filter(Boolean)).size;
            return {
                ...doc,
                revenue: revenue || doc.revenue || 0,
                patients_count: patientsCount || doc.patients_count || 0
            };
        });
    }, [doctorsQuery.data, transactions]);

    const totalEntradas = transactions
        .filter((t) => t.type === "entrada")
        .reduce((acc, t) => acc + (t.valueIn || 0), 0);

    const totalSaidas = transactions
        .filter((t) => t.type === "saida")
        .reduce((acc, t) => acc + (t.valueOut || 0), 0);

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
            transactionsQuery.refetch();
            doctorsQuery.refetch();
            bankAccountsQuery.refetch();
            patientsQuery.refetch();
            gastosQuery.refetch();
        }
    };
}
