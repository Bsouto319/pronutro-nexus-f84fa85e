import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2, Building2, CheckCircle2, LogOut, Users, Stethoscope, ShieldCheck } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";

const Onboarding = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { organizationId, loading: orgLoading, refresh } = useOrganization();
  const [step, setStep] = useState<"welcome" | "form">("welcome");
  const [clinicName, setClinicName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  if (authLoading || orgLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (organizationId) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName.trim()) return;
    setSubmitting(true);

    try {
      // 1) Garantir role admin ANTES de criar org (RLS de organizations exige admin)
      await supabase.from("user_roles").insert({ user_id: user.id, role: "admin" });

      // 2) Criar organização
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: clinicName.trim(), phone: phone.trim() || null, contact_email: user.email })
        .select("id")
        .single();
      if (orgError) throw orgError;

      // 3) Vincular como membro
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({ organization_id: org.id, user_id: user.id });
      if (memberError) throw memberError;

      toast.success("Clínica criada! Bem-vindo ao Atendent-AI 🎉");
      await refresh();
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao criar clínica.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "welcome") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-display font-bold">Bem-vindo ao Atendent-AI! 👋</CardTitle>
            <CardDescription className="text-base max-w-md mx-auto">
              Em 3 passos rápidos sua clínica estará pronta. Você será o <strong>Administrador</strong> e poderá convidar sua equipe depois.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-3">
              <Step n={1} icon={Building2} title="Cadastrar clínica" desc="Nome, telefone, logo" active />
              <Step n={2} icon={Users} title="Convidar equipe" desc="Defina papéis: Admin, Gerente, Atendente" />
              <Step n={3} icon={Stethoscope} title="Cadastrar médicos" desc="Horários e especialidades" />
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm">
              <p className="font-semibold flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4 text-primary" /> Controle de acesso por papel</p>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>• <strong>Atendente/Secretária:</strong> NÃO vê o módulo Financeiro</li>
                <li>• <strong>Gerente:</strong> Acesso total + Financeiro</li>
                <li>• <strong>Administrador:</strong> Tudo + gestão de equipe</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => setStep("form")} size="lg" className="flex-1 gradient-primary">
                Começar agora →
              </Button>
              <Button variant="ghost" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" /> Sair
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Logado como <strong>{user.email}</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Cadastre sua clínica</CardTitle>
          <CardDescription>Você poderá completar os dados (logo, CNPJ, endereço) depois.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clinic">Nome da clínica *</Label>
              <Input id="clinic" value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="Ex: Clínica Estética Beleza" required maxLength={100} autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("welcome")}>Voltar</Button>
              <Button type="submit" className="flex-1 gradient-primary" size="lg" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Criar e entrar
              </Button>
            </div>
            <button type="button" onClick={signOut} className="w-full text-xs text-muted-foreground hover:text-destructive underline">
              Sair desta conta
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

function Step({ n, icon: Icon, title, desc, active }: any) {
  return (
    <div className={`p-4 rounded-xl border ${active ? "border-primary bg-primary/5" : "border-border/40 bg-muted/20"}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{n}</div>
        <Icon className={`w-4 h-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
  );
}

export default Onboarding;
