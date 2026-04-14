import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

const roleLabels: Record<string, string> = {
  staff: "Atendente",
  doctor: "Médico",
  manager: "Gerente",
};

export function InviteTeamDialog() {
  const { organizationId } = useOrganization();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [submitting, setSubmitting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !email.trim()) return;
    setSubmitting(true);

    try {
      // Call edge function to invite
      const { data, error } = await supabase.functions.invoke("invite-member", {
        body: { email: email.trim(), role, organization_id: organizationId },
      });

      if (error) throw error;
      toast.success(`Convite enviado para ${email}`);
      setEmail("");
      setOpen(false);
    } catch (error: any) {
      if (import.meta.env.DEV) console.error(error);
      toast.error("Erro ao enviar convite. O usuário precisa estar cadastrado no sistema.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Convidar Equipe
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar Membro</DialogTitle>
          <DialogDescription>
            O usuário precisa ter uma conta cadastrada. Após o convite, ele terá acesso à sua clínica.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <Label>E-mail do membro</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="membro@clinica.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Função</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Enviar Convite
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
