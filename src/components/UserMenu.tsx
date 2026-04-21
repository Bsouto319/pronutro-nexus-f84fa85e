import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, Building2, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ClinicProfileDialog } from "./ClinicProfileDialog";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { organization } = useOrganization();
  const { isSuperAdmin } = useSuperAdmin();
  const navigate = useNavigate();
  const [clinicOpen, setClinicOpen] = useState(false);

  const initials = (user?.email || "U").slice(0, 2).toUpperCase();
  const displayName = (user?.user_metadata as any)?.full_name || user?.email?.split("@")[0] || "Usuário";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 p-1 rounded-full hover:bg-muted/60 transition-colors" aria-label="Menu do usuário">
            <Avatar className="w-9 h-9 border-2 border-primary/20">
              <AvatarImage src={(user?.user_metadata as any)?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium truncate">{displayName}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {organization && (
            <DropdownMenuItem onClick={() => setClinicOpen(true)}>
              <Building2 className="w-4 h-4 mr-2" /> Minha Clínica
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
            <Settings className="w-4 h-4 mr-2" /> Configurações
          </DropdownMenuItem>
          {isSuperAdmin && (
            <DropdownMenuItem onClick={() => navigate("/admin")}>
              <ShieldCheck className="w-4 h-4 mr-2 text-primary" /> Painel Super Admin
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ClinicProfileDialog open={clinicOpen} onOpenChange={setClinicOpen} />
    </>
  );
}
