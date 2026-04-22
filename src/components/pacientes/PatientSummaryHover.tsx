import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Pill, Stethoscope, Calendar, DollarSign, FileText } from "lucide-react";

interface Props {
  patient: any;
  children: React.ReactNode;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function PatientSummaryHover({ patient, children }: Props) {
  const { data: consultations = [] } = useQuery({
    queryKey: ["patient_summary", patient?.id],
    enabled: !!patient?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("patient_consultations")
        .select("consultation_date, procedure_name, procedure_value")
        .eq("patient_id", patient.id)
        .order("consultation_date", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const total = consultations.reduce((acc: number, c: any) => acc + (c.procedure_value || 0), 0);
  const lastDate = consultations[0]?.consultation_date;

  return (
    <HoverCard openDelay={250} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-96 glass border-primary/20 p-0 overflow-hidden" align="start">
        <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/5 border-b border-border/50">
          <p className="font-display font-bold text-foreground">{patient.name}</p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
            {patient.phone && <span>📱 {patient.phone}</span>}
            {patient.birth_date && <span>🎂 {new Date(patient.birth_date + "T12:00:00").toLocaleDateString("pt-BR")}</span>}
          </div>
        </div>

        <div className="p-4 space-y-3">
          {patient.allergies && (
            <div className="flex gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-destructive tracking-wider">Alergias</p>
                <p className="text-xs text-foreground">{patient.allergies}</p>
              </div>
            </div>
          )}

          {patient.diagnostics && (
            <div className="flex gap-2">
              <Stethoscope className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Diagnósticos</p>
                <p className="text-xs text-foreground line-clamp-2">{patient.diagnostics}</p>
              </div>
            </div>
          )}

          {patient.current_medications && (
            <div className="flex gap-2">
              <Pill className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Medicamentos em uso</p>
                <p className="text-xs text-foreground line-clamp-2">{patient.current_medications}</p>
              </div>
            </div>
          )}

          {patient.important_notes && (
            <div className="flex gap-2">
              <FileText className="w-4 h-4 text-chart-4 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Observações</p>
                <p className="text-xs text-foreground line-clamp-2">{patient.important_notes}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Consultas</p>
              <p className="text-sm font-bold text-foreground">{consultations.length}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Última</p>
              <p className="text-sm font-bold text-foreground">
                {lastDate ? new Date(lastDate + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Total</p>
              <p className="text-sm font-bold text-primary">{fmt(total)}</p>
            </div>
          </div>

          {consultations.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Últimos atendimentos</p>
              <div className="space-y-1">
                {consultations.slice(0, 3).map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(c.consultation_date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                      <span className="truncate max-w-[140px]">— {c.procedure_name || "Consulta"}</span>
                    </div>
                    <span className="text-primary font-semibold">{fmt(c.procedure_value || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!consultations.length && !patient.allergies && !patient.diagnostics && !patient.current_medications && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Sem histórico clínico. Abra o prontuário para começar.
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
