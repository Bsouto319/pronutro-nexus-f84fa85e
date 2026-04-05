import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useFinanceData } from "@/hooks/useFinanceData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Gift, Clock, Megaphone, Plus, Send, Check, Trash2, MessageSquare } from "lucide-react";
import { differenceInMonths, differenceInDays, format, parseISO } from "date-fns";

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  aniversario: { label: "Aniversário", icon: Gift, color: "text-chart-4" },
  reativacao: { label: "Reativação", icon: Clock, color: "text-chart-3" },
  promocao: { label: "Promoção", icon: Megaphone, color: "text-primary" },
  manual: { label: "Manual", icon: MessageSquare, color: "text-muted-foreground" },
};

export function FollowUpPanel() {
  const { organizationId } = useOrganization();
  const { patients } = useFinanceData();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ["follow_ups", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_ups")
        .select("*")
        .eq("organization_id", organizationId!)
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Auto-detect birthdays and inactive patients
  const suggestions = useMemo(() => {
    const today = new Date();
    const items: { type: string; patient: any; reason: string; message: string }[] = [];

    patients.forEach((p: any) => {
      // Birthday check
      if (p.birth_date) {
        try {
          const bd = parseISO(p.birth_date);
          const thisYear = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
          const diff = differenceInDays(thisYear, today);
          if (diff >= 0 && diff <= 30) {
            items.push({
              type: "aniversario",
              patient: p,
              reason: `Aniversário em ${format(thisYear, "dd/MM")}`,
              message: `🎂 Feliz aniversário, ${p.name.split(" ")[0]}! A equipe da clínica deseja muitas felicidades. Temos uma condição especial esperando por você! 💜`,
            });
          }
        } catch {}
      }

      // Inactive check (no consultation in 3+ months) — use created_at as proxy
      if (p.created_at) {
        const months = differenceInMonths(today, parseISO(p.created_at));
        if (months >= 3) {
          items.push({
            type: "reativacao",
            patient: p,
            reason: `Sem retorno há ${months} meses`,
            message: `Olá, ${p.name.split(" ")[0]}! Sentimos sua falta na clínica. Que tal agendar uma consulta de acompanhamento? Temos novidades que vão te interessar! 😊`,
          });
        }
      }
    });

    return items;
  }, [patients]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!organizationId) return;
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const { error } = await supabase.from("follow_ups").insert([{
        organization_id: organizationId,
        patient_id: fd.get("patient_id") as string,
        type: fd.get("type") as string,
        title: fd.get("title") as string,
        message: fd.get("message") as string || null,
        scheduled_date: fd.get("scheduled_date") as string || null,
      }]);
      if (error) throw error;
      toast.success("Follow-up criado!");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["follow_ups"] });
    } catch {
      toast.error("Erro ao criar follow-up.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const markDone = async (id: string) => {
    await supabase.from("follow_ups").update({ status: "concluido" }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["follow_ups"] });
    toast.success("Marcado como concluído!");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("follow_ups").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["follow_ups"] });
    toast.success("Removido!");
  };

  const sendWhatsApp = (phone: string | null, message: string) => {
    if (!phone) { toast.error("Paciente sem telefone cadastrado."); return; }
    const clean = phone.replace(/\D/g, "");
    const num = clean.startsWith("55") ? clean : `55${clean}`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const getPatient = (id: string) => patients.find((p: any) => p.id === id);

  return (
    <div className="space-y-6">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="glass rounded-xl p-5 border border-chart-4/30">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-chart-4" /> Sugestões Automáticas ({suggestions.length})
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {suggestions.map((s, i) => (
              <motion.div
                key={`${s.patient.id}-${s.type}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border border-border/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.patient.name}</p>
                  <p className="text-xs text-muted-foreground">{s.reason}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => sendWhatsApp(s.patient.phone, s.message)}
                >
                  <Send className="w-3.5 h-3.5 mr-1" /> Enviar
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-ups list */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Follow-ups Agendados</h3>
        <Button size="sm" className="gradient-primary" onClick={() => setAddOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Novo
        </Button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-4">Carregando...</p>
        ) : followUps.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Nenhum follow-up agendado.</p>
        ) : (
          followUps.map((fu: any, i: number) => {
            const cfg = typeConfig[fu.type] || typeConfig.manual;
            const Icon = cfg.icon;
            const pat = getPatient(fu.patient_id);
            return (
              <motion.div
                key={fu.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`glass rounded-lg p-4 border border-border/40 ${fu.status === "concluido" ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-4 h-4 ${cfg.color} shrink-0`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{fu.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {pat?.name || "Paciente"} • {fu.scheduled_date ? format(parseISO(fu.scheduled_date), "dd/MM/yyyy") : "Sem data"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {fu.status !== "concluido" && fu.message && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => sendWhatsApp(pat?.phone, fu.message)}>
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {fu.status !== "concluido" && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-chart-3" onClick={() => markDone(fu.id)}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(fu.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {fu.message && <p className="text-xs text-muted-foreground mt-2 pl-6 italic">{fu.message}</p>}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">Novo Follow-up</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select name="patient_id" required>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {patients.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select name="type" defaultValue="manual">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aniversario">🎂 Aniversário</SelectItem>
                    <SelectItem value="reativacao">⏰ Reativação</SelectItem>
                    <SelectItem value="promocao">📢 Promoção</SelectItem>
                    <SelectItem value="manual">💬 Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" name="scheduled_date" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input name="title" placeholder="Ex: Lembrete de retorno" required />
            </div>
            <div className="space-y-2">
              <Label>Mensagem (WhatsApp)</Label>
              <Textarea name="message" placeholder="Mensagem que será enviada ao paciente..." rows={3} />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full gradient-primary" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Follow-up"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
