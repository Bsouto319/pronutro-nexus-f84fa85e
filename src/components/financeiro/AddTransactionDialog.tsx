import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function AddTransactionDialog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) { toast.error("Você precisa estar logado."); return; }
    setIsSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const type = fd.get("type") as string;
    const value = parseFloat(fd.get("value") as string) || 0;

    try {
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!orgMember) throw new Error("Sem organização.");

      const { error } = await supabase.from("financial_transactions").insert([{
        organization_id: orgMember.organization_id,
        date: (fd.get("date") as string) || new Date().toISOString().split("T")[0],
        type,
        description: fd.get("description") as string || null,
        patient: fd.get("patient") as string || null,
        doctor: fd.get("doctor") as string || null,
        category: fd.get("category") as string || null,
        payment_method: fd.get("payment_method") as string || null,
        bank: fd.get("bank") as string || null,
        value_in: type === "entrada" ? value : 0,
        value_out: type === "saida" ? value : 0,
      }]);

      if (error) throw error;
      toast.success("Transação registrada!");
      queryClient.invalidateQueries({ queryKey: ["financial_transactions"] });
      setOpen(false);
    } catch (err: any) {
      if (import.meta.env.DEV) console.error(err);
      toast.error("Erro ao registrar transação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-primary/20 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold">Registrar Transação</DialogTitle>
          <DialogDescription>Adicione uma entrada ou saída manualmente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select name="type" defaultValue="entrada">
                <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input name="value" type="number" step="0.01" min="0" placeholder="0,00" className="glass" required />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Descrição</Label>
              <Input name="description" placeholder="Ex: Consulta retorno" className="glass" />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="glass" />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input name="category" placeholder="Ex: Consultas" className="glass" />
            </div>
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Input name="patient" placeholder="Nome do paciente" className="glass" />
            </div>
            <div className="space-y-2">
              <Label>Médico</Label>
              <Input name="doctor" placeholder="Nome do médico" className="glass" />
            </div>
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <Select name="payment_method" defaultValue="Pix">
                <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="Pix">Pix</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Convênio">Convênio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Banco / Conta</Label>
              <Input name="bank" placeholder="Ex: Nubank" className="glass" />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full gradient-primary" disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : "Confirmar Transação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
