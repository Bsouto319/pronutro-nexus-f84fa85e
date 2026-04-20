import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export type DaySchedule = { start: string; end: string; off: boolean };
export type WeekSchedule = Record<string, DaySchedule>;

const DAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

export const DEFAULT_SCHEDULE: WeekSchedule = DAYS.reduce((acc, d) => {
  acc[d.key] = { start: "08:00", end: "18:00", off: d.key === "sun" };
  return acc;
}, {} as WeekSchedule);

interface Props {
  value: WeekSchedule;
  onChange: (v: WeekSchedule) => void;
}

export function DoctorScheduleEditor({ value, onChange }: Props) {
  const update = (day: string, patch: Partial<DaySchedule>) => {
    onChange({ ...value, [day]: { ...value[day], ...patch } });
  };

  return (
    <div className="space-y-2">
      <Label>Horários por Dia</Label>
      <div className="rounded-lg border border-border/40 divide-y divide-border/30">
        {DAYS.map((d) => {
          const v = value[d.key] || { start: "08:00", end: "18:00", off: false };
          return (
            <div key={d.key} className="flex items-center gap-2 p-2 text-sm">
              <span className="w-20 font-medium text-foreground">{d.label}</span>
              <Switch
                checked={!v.off}
                onCheckedChange={(checked) => update(d.key, { off: !checked })}
              />
              <Input
                type="time"
                value={v.start}
                onChange={(e) => update(d.key, { start: e.target.value })}
                disabled={v.off}
                className="h-8 w-28"
              />
              <span className="text-muted-foreground">às</span>
              <Input
                type="time"
                value={v.end}
                onChange={(e) => update(d.key, { end: e.target.value })}
                disabled={v.off}
                className="h-8 w-28"
              />
              {v.off && <span className="text-xs text-muted-foreground ml-auto">Folga</span>}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Esses horários serão usados para validar agendamentos e evitar conflitos.
      </p>
    </div>
  );
}
