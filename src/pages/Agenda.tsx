import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const DEFAULT_ORG_ID = "65777d18-1126-481d-93d9-169237388d7f";

const statusStyles: Record<string, string> = {
  confirmado: "bg-success/15 text-success border-success/30",
  pendente: "bg-warning/15 text-warning border-warning/30",
  cancelado: "bg-destructive/15 text-destructive border-destructive/30",
};

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = selectedDate.toISOString().split("T")[0];

  const { data: agendamentos, isLoading, isError, refetch } = useQuery({
    queryKey: ["agendamentos", dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos" as any)
        .select("*")
        .eq("organization_id", DEFAULT_ORG_ID)
        .eq("date", dateStr)
        .order("time", { ascending: true });
      if (error) { console.warn("agendamentos:", error.message); return []; }
      return data || [];
    },
  });

  const changeDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

  const formatDateBR = (d: Date) => {
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  };

  const items = (agendamentos || []) as any[];

  return (
    <AppLayout>
      <TopBar title="Agenda Médica" subtitle="Visualize e gerencie os atendimentos do dia" onRefresh={() => refetch()} />
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">Agenda</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <button onClick={() => changeDay(-1)} className="hover:text-primary transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <span className="font-medium text-foreground">{formatDateBR(selectedDate)}</span>
                <button onClick={() => changeDay(1)} className="hover:text-primary transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 card-shadow">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse bg-muted/20 rounded-lg" />)}
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Erro ao carregar agendamentos.</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum agendamento para esta data.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((a: any, i: number) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/30 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[50px]">
                      <span className="text-lg font-bold text-primary">{a.time || "--:--"}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{a.patient_name}</p>
                      {a.doctor_name && <p className="text-xs text-muted-foreground">Dr(a). {a.doctor_name}</p>}
                      {a.source === "whatsapp" && <span className="text-[10px] text-primary">via WhatsApp</span>}
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] border", statusStyles[a.status] || statusStyles.pendente)}>
                    {a.status || "pendente"}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Agenda;
