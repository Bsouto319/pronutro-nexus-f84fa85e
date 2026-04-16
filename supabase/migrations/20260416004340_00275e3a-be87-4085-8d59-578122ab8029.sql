
UPDATE public.agendamentos
SET data_inicio = (date::text || 'T15:00:00+00:00')::timestamptz
WHERE data_inicio IS NULL AND date IS NOT NULL;
