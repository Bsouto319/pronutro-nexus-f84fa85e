import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  staff: "Atendente / Secretária",
  doctor: "Médico",
};

const ASSIGNABLE: AppRole[] = ["manager", "staff", "doctor"];

export function TeamManagement() {
  const { organizationId } = useOrganization();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["org_members_with_roles", organizationId],
    enabled: !!organizationId && isAdmin,
    queryFn: async () => {
      const { data: mems } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", organizationId!);
      const userIds = (mems || []).map((m) => m.user_id);
      if (userIds.length === 0) return [];
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);
      return userIds.map((uid) => ({
        user_id: uid,
        roles: (roles || []).filter((r) => r.user_id === uid).map((r) => r.role as string),
      }));
    },
  });

  const updateRole = async (userId: string, newRole: AppRole) => {
    setBusyId(userId);
    try {
      // Remove papéis "atribuíveis" antigos e insere o novo
      await supabase.from("user_roles").delete().eq("user_id", userId).in("role", ASSIGNABLE);
      const { error } = await supabase.from("user_roles").insert([{ user_id: userId, role: newRole }]);
      if (error) throw error;
      toast.success("Papel atualizado!");
      qc.invalidateQueries({ queryKey: ["org_members_with_roles"] });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar papel.");
    } finally {
      setBusyId(null);
    }
  };

  const removeMember = async (userId: string) => {
    if (!confirm("Remover este membro da organização?")) return;
    setBusyId(userId);
    try {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("organization_id", organizationId!)
        .eq("user_id", userId);
      if (error) throw error;
      toast.success("Membro removido.");
      qc.invalidateQueries({ queryKey: ["org_members_with_roles"] });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao remover membro.");
    } finally {
      setBusyId(null);
    }
  };

  if (!isAdmin) {
    return (
      <p className="text-sm text-muted-foreground">
        Apenas administradores podem gerenciar papéis da equipe.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <span><strong>Atendente</strong> não vê Financeiro. <strong>Gerente</strong> e <strong>Admin</strong> têm acesso total.</span>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando equipe...</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum membro na organização.</p>
      ) : (
        <div className="rounded-lg border border-border/40 divide-y divide-border/30">
          {members.map((m) => {
            const currentAssignable =
              m.roles.find((r) => ASSIGNABLE.includes(r as AppRole)) || "staff";
            const isMe = m.user_id === user?.id;
            const isOrgAdmin = m.roles.includes("admin");
            return (
              <div key={m.user_id} className="flex items-center gap-3 p-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-muted-foreground truncate">{m.user_id}</p>
                  <p className="text-foreground">
                    {isMe && <span className="text-primary font-semibold">(Você) </span>}
                    {m.roles.map((r) => ROLE_LABEL[r] || r).join(", ") || "Sem papel"}
                  </p>
                </div>
                <Select
                  value={currentAssignable}
                  onValueChange={(v) => updateRole(m.user_id, v as AppRole)}
                  disabled={isMe || isOrgAdmin || busyId === m.user_id}
                >
                  <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  disabled={isMe || isOrgAdmin || busyId === m.user_id}
                  onClick={() => removeMember(m.user_id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
