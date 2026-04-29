UPDATE public.agendamentos
SET data_inicio = ((to_char(date, 'YYYY-MM-DD') || 'T' || time || ':00-03:00')::timestamptz)
WHERE time IS NOT NULL
  AND time ~ '^[0-9]{2}:[0-9]{2}'
  AND date IS NOT NULL
  AND data_inicio <> ((to_char(date, 'YYYY-MM-DD') || 'T' || time || ':00-03:00')::timestamptz);