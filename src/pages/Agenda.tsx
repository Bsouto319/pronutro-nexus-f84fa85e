import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { AppointmentsList } from "@/components/AppointmentsList";
import { Button } from "@/components/ui/button";

const Agenda = () => (
  <AppLayout>
    <TopBar title="Agenda Médica" subtitle="Visualize e gerencie os atendimentos do dia" />
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Agenda</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <button className="hover:text-primary transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <span className="font-medium text-foreground">03 de Março, 2026</span>
              <button className="hover:text-primary transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
        <Button className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AppointmentsList />
        </div>
        <div className="glass rounded-xl p-6 h-fit h-full min-h-[400px]">
          <h3 className="font-display font-semibold mb-4">Filtros & Legenda</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span>Confirmado</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span>Pendente</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span>Cancelado</span>
            </div>
            <hr className="border-border/30 my-4" />
            <p className="text-xs text-muted-foreground italic">
              Dica: Use a assistente Maria no WhatsApp para agendamentos rápidos. Em caso de dificuldade: (61) 99954-8881.
            </p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
);

export default Agenda;
