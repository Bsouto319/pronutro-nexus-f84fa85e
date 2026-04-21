import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trash2, ShieldCheck, Crown, Briefcase, UserCircle, Stethoscope } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  staff: "Atendente",
  doctor: "Médico",
};

const ROLE_STYLE: Record<string, { className: string; Icon: any }> = {
  admin: { className: "bg-primary/10 text-primary border-primary/30", Icon: Crown },
  manager: { className: "bg-blue-500/10 text-blue-600 border-blue-500/30", Icon: Briefcase },
  staff: { className: "bg-amber-500/10 text-amber-700 border-amber-500/30", Icon: UserCircle },
  doctor: { className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30", Icon: Stethoscope },
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
        .select("user_id, created_at")
        .eq("organization_id", organizationId!);
      const userIds = (mems || []).map((m) => m.user_id);
      if (userIds.length === 0) return [];

      const [rolesRes, profilesRes] = await Promise.all([
        supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
        supabase.from("profiles").select("id, email, full_name, avatar_url").in("id", userIds),
      ]);

      return userIds.map((uid) => {
        const profile = (profilesRes.data || []).find((p: any) => p.id === uid);
        return {
          user_id: uid,
          email: profile?.email || "—",
          full_name: profile?.full_name || profile?.email?.split("@")[0] || "Membro",
          avatar_url: profile?.avatar_url,
          roles: (rolesRes.data || []).filter((r: any) => r.user_id === uid).map((r: any) => r.role as string),
          joined_at: (mems || []).find((m) => m.user_id === uid)?.created_at,
        };
      });
    },
  });

  const updateRole = async (userId: string, newRole: AppRole) => {
    setBusyId(userId);
    try {
      await supabase.from("user_roles").delete().eq("user_id", userId).in("role", ASSIGNABLE);
      const { error } = await supabase.from("user_roles").insert([{ user_id: userId, role: newRole }]);
      if (error) throw error;
      toast.success(`Papel atualizado para ${ROLE_LABEL[newRole]}!`);
      qc.invalidateQueries({ queryKey: ["org_members_with_roles"] });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar papel.");
    } finally {
      setBusyId(null);
    }
  };

  const removeMember = async (userId: string, name: string) => {
    if (!confirm(`Remover ${name} da clínica? Ele perderá o acesso imediatamente.`)) return;
    setBusyId(userId);
    try {
      await supabase.from("user_roles").delete().eq("user_id", userId).in("role", ASSIGNABLE);
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
      <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Apenas administradores podem gerenciar a equipe.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
          Nenhum membro ainda. Use o botão "Convidar Equipe" acima.
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => {
            const currentAssignable = m.roles.find((r) => ASSIGNABLE.includes(r as AppRole)) || "staff";
            const isMe = m.user_id === user?.id;
            const isOrgAdmin = m.roles.includes("admin");
            const initials = (m.full_name || m.email).split(/\s+/).map(s => s[0]).slice(0, 2).join("").toUpperCase();
            const primaryRole = isOrgAdmin ? "admin" : currentAssignable;
            const roleStyle = ROLE_STYLE[primaryRole];
            const RoleIcon = roleStyle.Icon;

            return (
              <div key={m.user_id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-border/40 bg-card hover:bg-muted/20 transition-colors">
                <Avatar className="w-10 h-10 border border-border/40">
                  <AvatarImage src={m.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground truncate">
                      {m.full_name}
                      {isMe && <span className="text-primary text-xs ml-1.5">(Você)</span>}
                    </p>
                    <Badge variant="outline" className={roleStyle.className}>
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {ROLE_LABEL[primaryRole]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={currentAssignable} onValueChange={(v) => updateRole(m.user_id, v as AppRole)} disabled={isMe || isOrgAdmin || busyId === m.user_id}>
                    <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE.map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" disabled={isMe || isOrgAdmin || busyId === m.user_id} onClick={() => removeMember(m.user_id, m.full_name)} title="Remover membro">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
