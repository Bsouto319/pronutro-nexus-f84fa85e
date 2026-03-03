import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { FileText } from "lucide-react";

const Procedimentos = () => (
  <AppLayout>
    <TopBar />
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Procedimentos</h1>
      </div>
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">Módulo de procedimentos em construção.</p>
      </div>
    </div>
  </AppLayout>
);

export default Procedimentos;
