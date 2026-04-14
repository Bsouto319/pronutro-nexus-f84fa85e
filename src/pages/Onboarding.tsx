import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2, Building2 } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const { organizationId, loading: orgLoading } = useOrganization();
  const [clinicName, setClinicName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (organizationId) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName.trim()) return;
    setSubmitting(true);

    try {
      // Create org
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: clinicName.trim() })
        .select("id")
        .single();

      if (orgError) throw orgError;

      // Add user as member
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({ organization_id: org.id, user_id: user.id });

      if (memberError) throw memberError;

      // Assign admin role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "admin" });

      if (roleError && !roleError.message?.includes("duplicate")) {
        if (import.meta.env.DEV) console.warn(roleError);
      }

      toast.success("Clínica criada com sucesso! Bem-vindo!");
      navigate("/dashboard");
    } catch (error: any) {
      if (import.meta.env.DEV) console.error(error);
      toast.error("Erro ao criar clínica. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Bem-vindo ao Atendent-AI!</CardTitle>
          <CardDescription className="text-base">
            Para começar, crie sua clínica. Você poderá convidar sua equipe depois.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="clinic">Nome da Clínica</Label>
              <Input
                id="clinic"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Ex: Clínica Estética Beleza"
                required
                maxLength={100}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar Clínica e Começar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
