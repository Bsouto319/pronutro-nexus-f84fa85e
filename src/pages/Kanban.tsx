import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Clock, CheckCircle2, Calendar, AlertCircle, RefreshCw, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    novo_lead: { label: "Entrada N8N", color: "bg-blue-500", icon: Smartphone },
    em_atendimento: { label: "Maria IA", color: "bg-emerald-500", icon: Smartphone },
    qualificado: { label: "Interesse Real", color: "bg-amber-500", icon: CheckCircle2 },
    agendado: { label: "Agendado", color: "bg-purple-500", icon: Calendar },
    perdido: { label: "Perdido", color: "bg-zinc-600", icon: AlertCircle },
};

const Kanban = () => {
    const { organizationId } = useOrganization();

    const { data: leads, isLoading, refetch } = useQuery({
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
        refetchInterval: 15000,
    });

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from("leads")
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq("id", id);

            if (error) throw error;
            toast.success("Status atualizado!");
            refetch();
        } catch (err) {
            toast.error("Erro ao atualizar status.");
        }
    };

    const columns = ["novo_lead", "em_atendimento", "qualificado", "agendado", "perdido"];

    return (
        <AppLayout>
            <TopBar title="Gestão de Leads" subtitle="Monitoramento em tempo real da Maria IA" />
            <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto overflow-hidden flex flex-col h-[calc(100vh-140px)]">

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-full">
                    {columns.map((status) => (
                        <div key={status} className="flex flex-col gap-4 h-full min-w-[280px]">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${statusConfig[status].color}`} />
                                    <h3 className="font-display font-bold text-sm text-foreground">{statusConfig[status].label}</h3>
                                </div>
                                <Badge variant="outline" className="text-[10px] opacity-60">
                                    {leads?.filter(l => (l.status || "novo_lead") === status).length || 0}
                                </Badge>
                            </div>

                            <div className="bg-muted/10 rounded-xl p-3 space-y-3 overflow-y-auto custom-scrollbar border border-border/30 h-full">
                                <AnimatePresence>
                                    {leads?.filter(l => (l.status || "novo_lead") === status).map((lead) => (
                                        <motion.div
                                            key={lead.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="glass p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all group"
                                        >
                                            <div className="flex flex-col gap-1 mb-3">
                                                <span className="text-sm font-bold text-foreground truncate">{lead.name || "Novo Lead"}</span>
                                                <span className="text-[10px] text-muted-foreground font-mono">{lead.phone || "Sem telefone"}</span>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-border/30">
                                                <span className="text-[9px] text-muted-foreground">
                                                    {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>

                                                <select
                                                    value={lead.status || "novo_lead"}
                                                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                                                    className="bg-transparent text-[10px] font-bold text-primary outline-none cursor-pointer hover:underline"
                                                >
                                                    {columns.map(c => (
                                                        <option key={c} value={c} className="bg-background text-foreground">{statusConfig[c].label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </motion.div>
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
        </AppLayout>
    );
};

export default Kanban;
