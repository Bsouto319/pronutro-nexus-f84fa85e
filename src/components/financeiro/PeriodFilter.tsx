import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export type PeriodRange = { from: Date; to: Date; label: string } | null;

const presets = [
  { label: "Este mês", getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Mês passado", getRange: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: "Esta semana", getRange: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
  { label: "Últimos 3 meses", getRange: () => ({ from: startOfMonth(subMonths(new Date(), 2)), to: endOfMonth(new Date()) }) },
];

interface PeriodFilterProps {
  value: PeriodRange;
  onChange: (range: PeriodRange) => void;
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Button
        variant={!value ? "default" : "outline"}
        size="sm"
        onClick={() => onChange(null)}
        className="text-xs"
      >
        Tudo
      </Button>
      {presets.map((p) => {
        const isActive = value?.label === p.label;
        return (
          <Button
            key={p.label}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => {
              const range = p.getRange();
              onChange({ ...range, label: p.label });
            }}
          >
            {p.label}
          </Button>
        );
      })}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs gap-1">
            <CalendarDays className="w-3 h-3" />
            {value?.label === "custom"
              ? `${format(value.from, "dd/MM")} - ${format(value.to, "dd/MM")}`
              : "Personalizado"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            locale={ptBR}
            selected={value ? { from: value.from, to: value.to } : undefined}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onChange({ from: range.from, to: range.to, label: "custom" });
                setOpen(false);
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
