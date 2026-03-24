import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { FileText, Plus, Pencil, Trash2, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Procedimentos = () => {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const { data: procedures = [], isLoading } = useQuery({
    queryKey: ["procedures", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procedures")
        .select("*")
        .eq("organization_id", organizationId!)
        .order("name", { ascending: true });
      if (error) { if (import.meta.env.DEV) console.warn(error.message); return []; }
      return data || [];
    },
  });

  const resetForm = () => { setFormName(""); setFormPrice(""); setFormDuration(""); setFormDescription(""); };

  const openAdd = () => { resetForm(); setAddOpen(true); };

  const openEdit = (proc: any) => {
    setSelected(proc);
    setFormName(proc.name);
    setFormPrice(String(proc.price || ""));
    setFormDuration(String(proc.duration_minutes || ""));
    setFormDescription(proc.description || "");
    setEditOpen(true);
  };

  const handleAdd = async () => {
    if (!organizationId || !formName) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("procedures").insert([{
        organization_id: organizationId,
        name: formName,
        price: formPrice ? parseFloat(formPrice) : 0,
        duration_minutes: formDuration ? parseInt(formDuration) : null,
        description: formDescription || null,
      }]);
      if (error) throw error;
      toast.success("Procedimento criado!");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("procedures")
        .update({
          name: formName,
          price: formPrice ? parseFloat(formPrice) : 0,
          duration_minutes: formDuration ? parseInt(formDuration) : null,
          description: formDescription || null,
        })
        .eq("id", selected.id);
      if (error) throw error;
      toast.success("Procedimento atualizado!");
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("procedures").delete().eq("id", selected.id);
      if (error) throw error;
      toast.success("Procedimento removido!");
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ProcForm = ({ onSubmit, label }: { onSubmit: () => void; label: string }) => (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Nome do Procedimento *</Label>
        <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Consulta Nutricional" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Valor (R$)</Label>
          <Input type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-2">
          <Label>Duração (min)</Label>
          <Input type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="30" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Descrição opcional" />
      </div>
      <DialogFooter>
        <Button onClick={onSubmit} disabled={isSubmitting || !formName} className="w-full gradient-primary">
          {isSubmitting ? "Salvando..." : label}
        </Button>
      </DialogFooter>
    </div>
  );

  return (
    <AppLayout>
      <TopBar title="Procedimentos" subtitle="Gerencie os procedimentos da clínica" />
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Procedimentos</h1>
              <p className="text-sm text-muted-foreground">{procedures.length} procedimentos cadastrados</p>
            </div>
          </div>
          <Button onClick={openAdd} className="gradient-primary"><Plus className="w-4 h-4 mr-2" /> Novo Procedimento</Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-36 animate-pulse bg-muted/20 rounded-2xl" />)}
          </div>
        ) : procedures.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border border-border/40">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum procedimento cadastrado ainda.</p>
            <Button onClick={openAdd} variant="outline" className="mt-4"><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {procedures.map((proc: any, i: number) => (
              <motion.div
                key={proc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-2xl p-5 border border-border/40 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(proc)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSelected(proc); setDeleteOpen(true); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <p className="font-display font-bold text-foreground truncate">{proc.name}</p>
                {proc.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{proc.description}</p>}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/30 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> R$ {(proc.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  {proc.duration_minutes && <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {proc.duration_minutes} min</span>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader><DialogTitle>Novo Procedimento</DialogTitle><DialogDescription>Cadastre um procedimento da clínica.</DialogDescription></DialogHeader>
          <ProcForm onSubmit={handleAdd} label="Criar Procedimento" />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader><DialogTitle>Editar Procedimento</DialogTitle><DialogDescription>Altere os dados.</DialogDescription></DialogHeader>
          <ProcForm onSubmit={handleEdit} label="Salvar" />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Procedimento</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja remover <strong>{selected?.name}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{isSubmitting ? "Excluindo..." : "Excluir"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Procedimentos;
