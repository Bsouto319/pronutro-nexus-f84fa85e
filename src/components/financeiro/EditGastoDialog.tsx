import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useFinanceData } from "@/hooks/useFinanceData";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

interface EditGastoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gasto: {
    id: string;
    description: string;
    category: string;
    fornecedor: string | null;
    paymentMethod: string | null;
    source: string;
    valueOut?: number;
    valueIn?: number;
  } | null;
}

export function EditGastoDialog({ open, onOpenChange, gasto }: EditGastoDialogProps) {
  const { doctors, refetch } = useFinanceData();
  const [doctorId, setDoctorId] = useState<string>("");
  const [origemPagamento, setOrigemPagamento] = useState("");
  const [categoria, setCategoria] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (gasto) {
      setCategoria(gasto.category || "");
      setFornecedor(gasto.fornecedor || "");
      setDescricao(gasto.description || "");
      setValor(
        gasto.valueOut && gasto.valueOut > 0
          ? String(gasto.valueOut)
          : gasto.valueIn && gasto.valueIn > 0
          ? String(gasto.valueIn)
          : ""
      );
      setDoctorId("");
      setOrigemPagamento("");
    }
  }, [gasto]);

  if (!gasto) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsedValor = valor ? parseFloat(valor.replace(/[^\d.,]/g, "").replace(",", ".")) : null;

      if (gasto.source === "gasto") {
        const updates: Record<string, unknown> = {};
        if (categoria) updates.categoria = categoria;
        if (fornecedor) updates.fornecedor = fornecedor;
        if (descricao) updates.descricao = descricao;
        if (doctorId) updates.doctor_id = doctorId;
        if (origemPagamento) updates.origem_pagamento = origemPagamento;
        if (parsedValor !== null && !isNaN(parsedValor)) updates.valor = parsedValor;

        const { error } = await supabase
          .from("gastos")
          .update(updates)
          .eq("id", gasto.id);

        if (error) throw error;
      } else {
        const updates: Record<string, unknown> = {};
        if (categoria) updates.category = categoria;
        if (descricao) updates.description = descricao;
        if (doctorId) {
          const doc = doctors.find(d => d.id === doctorId);
          if (doc) updates.doctor = doc.name;
        }
        if (origemPagamento) updates.bank = origemPagamento;
        if (parsedValor !== null && !isNaN(parsedValor)) {
          if ((gasto.valueIn || 0) > 0) {
            updates.value_in = parsedValor;
          } else {
            updates.value_out = parsedValor;
          }
        }

        const { error } = await supabase
          .from("financial_transactions")
          .update(updates)
          .eq("id", gasto.id);

        if (error) throw error;
      }

      toast.success("Registro atualizado!");
      refetch();
      onOpenChange(false);
    } catch {
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    setDeleting(true);
    try {
      const table = gasto.source === "gasto" ? "gastos" : "financial_transactions";
      const { error } = await supabase.from(table).delete().eq("id", gasto.id);
      if (error) throw error;

      toast.success("Registro excluído!");
      refetch();
      onOpenChange(false);
    } catch {
      toast.error("Erro ao excluir registro");
    } finally {
      setDeleting(false);
    }
  };

  const origens = ["Máquina de Cartão", "Pix", "Dinheiro", "Transferência", "Boleto", "Convênio", "Cheque"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">✏️ Editar Movimentação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-xs">Descrição</Label>
            <Input
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Descrição do registro"
              className="text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Valor (R$)</Label>
            <Input
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="Ex: 1500.00"
              className="text-xs"
              type="text"
              inputMode="decimal"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Médico Responsável</Label>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Selecione o médico" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map(doc => (
                  <SelectItem key={doc.id} value={doc.id} className="text-xs">{doc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Origem do Pagamento</Label>
            <Select value={origemPagamento} onValueChange={setOrigemPagamento}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="De onde veio o pagamento?" />
              </SelectTrigger>
              <SelectContent>
                {origens.map(o => (
                  <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Categoria</Label>
            <Input
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              placeholder="Ex: Combustível, Insumos..."
              className="text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Fornecedor</Label>
            <Input
              value={fornecedor}
              onChange={e => setFornecedor(e.target.value)}
              placeholder="Ex: Posto Shell, Farmácia..."
              className="text-xs"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || deleting} className="flex-1 text-xs">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving || deleting}
              className="text-xs gap-1.5"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Excluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
