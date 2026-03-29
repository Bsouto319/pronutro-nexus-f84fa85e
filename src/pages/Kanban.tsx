import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { AnimatePresence } from "framer-motion";
import { CheckCircle2, Calendar, AlertCircle, Smartphone, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { LeadCard } from "@/components/kanban/LeadCard";
import { LeadPanel } from "@/components/kanban/LeadPanel";
import { LeadStatsRow } from "@/components/kanban/LeadStatsRow";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  novo_lead: { label: "Entrada N8N", color: "bg-blue-500", icon: Smartphone },
  em_atendimento: { label: "Maria IA", color: "bg-emerald-500", icon: Smartphone },
  qualificado: { label: "Interesse Real", color: "bg-amber-500", icon: CheckCircle2 },
  agendado: { label: "Agendado", color: "bg-purple-500", icon: Calendar },
  perdido: { label: "Perdido", color: "bg-zinc-600", icon: AlertCircle },
};

const columns = ["novo_lead", "em_atendimento", "qualificado", "agendado", "perdido"];

const Kanban = () => {
  const { organizationId } = useOrganization();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const { data: leads, refetch } = useQuery({
    queryKey: ["leads_kanban", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("organization_id", organizationId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
      toast.success("Status atualizado!");
      refetch();
    } catch {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleCardClick = (lead: any) => {
    setSelectedLead(lead);
    setPanelOpen(true);
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
      toast.success("Lead removido!");
      refetch();
    } catch {
      toast.error("Erro ao remover lead.");
    }
  };

  const deleteOldLeads = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("organization_id", organizationId!)
        .lt("created_at", today);
      if (error) throw error;
      toast.success("Leads anteriores removidos!");
      refetch();
    } catch {
      toast.error("Erro ao remover leads antigos.");
    }
  };

  const statusOptions = columns.map(c => ({ value: c, label: statusConfig[c].label }));

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayLeads = leads?.filter(l => l.created_at.slice(0, 10) === today).length || 0;
    const aguardando = leads?.filter(l => l.status === "qualificado").length || 0;
    const total = leads?.length || 1;
    const atendidos = leads?.filter(l => l.status !== "novo_lead").length || 0;
    const taxa = Math.round((atendidos / total) * 100);
    return { leadsHoje: todayLeads, consultasHoje: leads?.filter(l => l.status === "agendado").length || 0, taxaResposta: taxa, aguardandoHumano: aguardando };
  }, [leads]);

  return (
    <AppLayout>
      <TopBar title="Gestão de Leads" subtitle="Monitoramento em tempo real da Maria IA" />
      <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        <div className="flex items-center justify-between">
          <LeadStatsRow {...stats} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0 ml-3">
                <Trash2 className="w-4 h-4" /> Limpar antigos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover leads antigos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso irá remover todos os leads criados antes de hoje. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={deleteOldLeads} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1 min-h-0">
          {columns.map((status) => (
            <div key={status} className="flex flex-col gap-3 min-h-0">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusConfig[status].color}`} />
                  <h3 className="font-display font-bold text-sm text-foreground">{statusConfig[status].label}</h3>
                </div>
                <Badge variant="outline" className="text-[10px] opacity-60">
                  {leads?.filter(l => (l.status || "novo_lead") === status).length || 0}
                </Badge>
              </div>

              <div className="bg-muted/10 rounded-xl p-3 space-y-3 overflow-y-auto custom-scrollbar border border-border/30 flex-1">
                <AnimatePresence>
                  {leads?.filter(l => (l.status || "novo_lead") === status).map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onClick={() => handleCardClick(lead)}
                      statusOptions={statusOptions}
                      onStatusChange={updateStatus}
                      onDelete={deleteLead}
                    />
                  ))}
                </AnimatePresence>

                {leads?.filter(l => (l.status || "novo_lead") === status).length === 0 && (
                  <div className="py-12 text-center opacity-20">
                    <Smartphone className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-[10px] uppercase font-bold">Vazio</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <LeadPanel lead={selectedLead} open={panelOpen} onClose={() => setPanelOpen(false)} />
    </AppLayout>
  );
};

export default Kanban;
