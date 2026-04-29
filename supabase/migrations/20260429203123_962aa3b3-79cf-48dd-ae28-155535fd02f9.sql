UPDATE public.agendamentos SET status = status
WHERE paciente_nome IS NOT NULL AND paciente_nome <> '' AND paciente_nome <> 'Paciente não identificado';