
CREATE OR REPLACE FUNCTION public.auto_create_lead_from_agendamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE organization_id = NEW.organization_id
      AND name = NEW.patient_name
  ) THEN
    INSERT INTO public.leads (organization_id, name, phone, source, status)
    VALUES (
      NEW.organization_id,
      NEW.patient_name,
      CASE
        WHEN NEW.notes ~ 'Tel:\s*(\d+)' THEN substring(NEW.notes from 'Tel:\s*(\d+)')
        ELSE NULL
      END,
      COALESCE(NEW.source, 'manual'),
      CASE
        WHEN NEW.status = 'confirmado' THEN 'agendado'
        ELSE 'novo_lead'
      END
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_lead
  AFTER INSERT ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_lead_from_agendamento();

INSERT INTO public.leads (organization_id, name, phone, source, status)
SELECT DISTINCT ON (a.patient_name, a.organization_id)
  a.organization_id,
  a.patient_name,
  CASE
    WHEN a.notes ~ 'Tel:\s*(\d+)' THEN substring(a.notes from 'Tel:\s*(\d+)')
    ELSE NULL
  END,
  COALESCE(a.source, 'manual'),
  CASE
    WHEN a.status = 'confirmado' THEN 'agendado'
    ELSE 'novo_lead'
  END
FROM public.agendamentos a
WHERE NOT EXISTS (
  SELECT 1 FROM public.leads l
  WHERE l.organization_id = a.organization_id AND l.name = a.patient_name
)
ORDER BY a.patient_name, a.organization_id, a.created_at DESC
