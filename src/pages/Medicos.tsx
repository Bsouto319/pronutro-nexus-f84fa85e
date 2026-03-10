import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { Stethoscope, Plus, User, Award, DollarSign } from "lucide-react";
import { DoctorsGrid } from "@/components/DoctorsGrid";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

const Medicos = () => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleAddDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast.error("Você precisa estar logado.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const specialty = formData.get("specialty") as string;

    try {
      // Fetch organization
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!orgMember) throw new Error("Usuário não possui organização.");

      const { error } = await supabase
        .from("clinic_doctors")
        .insert([{
          name,
          specialty,
          organization_id: orgMember.organization_id
        }]);

      if (error) throw error;

      toast.success("Médico cadastrado com sucesso!");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["clinic_doctors"] });
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao cadastrar médico: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <TopBar title="Corpo Clínico" subtitle="Gerencie os profissionais da ProNutro" />
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Médicos</h1>
              <p className="text-sm text-muted-foreground">Gestão de profissionais e especialidades</p>
            </div>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Novo Médico
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-primary/20 sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-display font-bold">Cadastrar Novo Profissional</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Insira os detalhes do novo médico para que ele apareça no dashboard.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddDoctor} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="name" name="name" placeholder="Ex: Dr. João Silva" className="pl-10 glass" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty" className="text-sm font-medium">Especialidade</Label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="specialty" name="specialty" placeholder="Ex: Nutrologia e Esporte" className="pl-10 glass" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium">Valor da Consulta (Opcional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="price" name="price" placeholder="Ex: R$ 500" className="pl-10 glass" />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full gradient-primary" disabled={isSubmitting}>
                    {isSubmitting ? "Cadastrando..." : "Confirmar Cadastro"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DoctorsGrid />
      </div>
    </AppLayout>
  );
};

export default Medicos;
