import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Blocked() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full glass rounded-2xl p-8 text-center card-shadow">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-display font-bold mb-2">Acesso Suspenso</h1>
        <p className="text-muted-foreground mb-6">
          Sua organização está com o acesso bloqueado. Entre em contato com o administrador para regularizar o pagamento e reativar o sistema.
        </p>
        <div className="flex flex-col gap-2">
          <a
            href="https://wa.me/5561999548881"
            className="text-sm text-primary hover:underline"
          >
            📞 (61) 99954-8881
          </a>
          <Button variant="outline" onClick={signOut}>Sair</Button>
        </div>
      </div>
    </div>
  );
}
