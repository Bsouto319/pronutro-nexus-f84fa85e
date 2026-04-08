import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function ClearAllFinanceDialog() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleClearAll = async () => {
    if (!organizationId || confirmText !== "APAGAR TUDO") return;
    setIsDeleting(true);
    try {
      const { error: e1 } = await supabase
        .from("financial_transactions")
        .delete()
        .eq("organization_id", organizationId);

      const { error: e2 } = await supabase
        .from("gastos")
        .delete()
        .eq("organization_id", organizationId);

      if (e1 || e2) {
        toast.error("Erro ao apagar registros financeiros.");
        if (import.meta.env.DEV) console.warn(e1, e2);
      } else {
        toast.success("Todos os registros financeiros foram apagados.");
        queryClient.invalidateQueries({ queryKey: ["financial_transactions"] });
        queryClient.invalidateQueries({ queryKey: ["gastos"] });
      }
    } catch {
      toast.error("Erro inesperado ao apagar dados.");
    } finally {
      setIsDeleting(false);
      setConfirmText("");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="w-4 h-4" />
          Apagar Tudo
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Apagar TODOS os registros financeiros?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Esta ação é <strong>irreversível</strong>. Todas as transações e gastos serão permanentemente removidos.
            </span>
            <span className="block mt-2">
              Digite <strong>APAGAR TUDO</strong> para confirmar:
            </span>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="APAGAR TUDO"
              className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-destructive"
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText("")}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClearAll}
            disabled={confirmText !== "APAGAR TUDO" || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Apagando..." : "Confirmar exclusão"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
