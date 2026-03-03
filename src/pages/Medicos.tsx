import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { Stethoscope, Plus } from "lucide-react";
import { DoctorsGrid } from "@/components/DoctorsGrid";
import { Button } from "@/components/ui/button";

const Medicos = () => (
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
        <Button className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Novo Médico
        </Button>
      </div>

      <DoctorsGrid />
    </div>
  </AppLayout>
);

export default Medicos;
