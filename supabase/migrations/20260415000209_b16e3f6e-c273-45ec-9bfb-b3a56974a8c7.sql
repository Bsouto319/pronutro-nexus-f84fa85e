
-- Add new columns to agendamentos
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS paciente_nome text;
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS profissional text;
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS data_inicio timestamptz;
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS data_fim timestamptz;
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS titulo text;
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS valor numeric DEFAULT 0;
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS google_event_id text;
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS paciente_telefone text;

-- Recreate lead sync trigger function using paciente_telefone as UPSERT key
CREATE OR REPLACE FUNCTION public.auto_create_lead_from_agendamento()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  resolved_name text;
  resolved_phone text;
  normalized_status text;
  existing_lead_id uuid;
BEGIN
  -- Resolve name: prefer paciente_nome, fallback to patient_name
  resolved_name := COALESCE(NULLIF(TRIM(NEW.paciente_nome), ''), NULLIF(TRIM(NEW.patient_name), ''), 'Paciente não identificado');
  
  -- Resolve phone: prefer paciente_telefone
  resolved_phone := NULLIF(TRIM(COALESCE(NEW.paciente_telefone, '')), '');
  
  -- If no phone from paciente_telefone, try extracting from notes (legacy)
  IF resolved_phone IS NULL THEN
    resolved_phone := NULLIF(substring(COALESCE(NEW.notes, '') from '(?:Tel|Telefone|Fone|WhatsApp|Whatsapp)\s*:?\s*([+0-9()\-\s]{8,})'), '');
  END IF;

  normalized_status := CASE
    WHEN NEW.status = 'confirmado' THEN 'agendado'
    WHEN NEW.status = 'cancelado' THEN 'perdido'
    ELSE 'agendado'
  END;

  -- UPSERT by phone first, then by name
  IF resolved_phone IS NOT NULL THEN
    SELECT l.id INTO existing_lead_id
    FROM public.leads l
    WHERE l.organization_id = NEW.organization_id
      AND l.phone = resolved_phone
    ORDER BY l.created_at DESC
    LIMIT 1;
  END IF;

  IF existing_lead_id IS NULL THEN
    SELECT l.id INTO existing_lead_id
    FROM public.leads l
    WHERE l.organization_id = NEW.organization_id
      AND LOWER(TRIM(l.name)) = LOWER(resolved_name)
    ORDER BY l.created_at DESC
    LIMIT 1;
  END IF;

  IF existing_lead_id IS NULL THEN
    INSERT INTO public.leads (
      organization_id, name, phone, source, status, channel, last_message, last_message_at
    ) VALUES (
      NEW.organization_id,
      resolved_name,
      resolved_phone,
      COALESCE(NULLIF(NEW.source, ''), 'google_calendar'),
      normalized_status,
      CASE WHEN resolved_phone IS NOT NULL THEN 'whatsapp' ELSE NULL END,
      COALESCE(NEW.titulo, NULLIF(NEW.notes, ''), 'Agendamento criado'),
      COALESCE(NEW.created_at, now())
    );
  ELSE
    UPDATE public.leads
    SET
      status = normalized_status,
      name = CASE WHEN resolved_name <> 'Paciente não identificado' THEN resolved_name ELSE public.leads.name END,
      phone = COALESCE(resolved_phone, public.leads.phone),
      last_message = COALESCE(NEW.titulo, NULLIF(NEW.notes, ''), public.leads.last_message, 'Agendamento atualizado'),
      last_message_at = COALESCE(NEW.created_at, now())
    WHERE id = existing_lead_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Recreate patient sync trigger function
CREATE OR REPLACE FUNCTION public.auto_create_patient_from_agendamento()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  resolved_name text;
  resolved_phone text;
  existing_patient_id uuid;
  matched_doctor_id uuid;
BEGIN
  resolved_name := COALESCE(NULLIF(TRIM(NEW.paciente_nome), ''), NULLIF(TRIM(NEW.patient_name), ''), 'Paciente não identificado');
  resolved_phone := NULLIF(TRIM(COALESCE(NEW.paciente_telefone, '')), '');
  
  IF resolved_phone IS NULL THEN
    resolved_phone := NULLIF(substring(COALESCE(NEW.notes, '') from '(?:Tel|Telefone|Fone|WhatsApp|Whatsapp)\s*:?\s*([+0-9()\-\s]{8,})'), '');
  END IF;

  -- Skip if name is generic
  IF resolved_name = 'Paciente não identificado' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO existing_patient_id
  FROM public.clinic_patients
  WHERE organization_id = NEW.organization_id
    AND LOWER(TRIM(name)) = LOWER(resolved_name)
  LIMIT 1;

  -- Try to find doctor by profissional or doctor_name
  SELECT id INTO matched_doctor_id
  FROM public.clinic_doctors
  WHERE organization_id = NEW.organization_id
    AND LOWER(TRIM(name)) = LOWER(TRIM(COALESCE(NEW.profissional, NEW.doctor_name, '')))
  LIMIT 1;

  IF existing_patient_id IS NULL THEN
    INSERT INTO public.clinic_patients (
      organization_id, name, phone, doctor_id
    ) VALUES (
      NEW.organization_id, resolved_name, resolved_phone, matched_doctor_id
    );
  ELSE
    UPDATE public.clinic_patients
    SET phone = COALESCE(clinic_patients.phone, resolved_phone),
        doctor_id = COALESCE(clinic_patients.doctor_id, matched_doctor_id)
    WHERE id = existing_patient_id
      AND (clinic_patients.phone IS NULL OR clinic_patients.doctor_id IS NULL);
  END IF;

  RETURN NEW;
END;
$function$;

-- Recreate triggers (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS trg_auto_create_lead ON public.agendamentos;
DROP TRIGGER IF EXISTS trg_auto_create_patient ON public.agendamentos;
DROP TRIGGER IF EXISTS trg_auto_create_lead_from_agendamento ON public.agendamentos;
DROP TRIGGER IF EXISTS trg_auto_create_patient_from_agendamento ON public.agendamentos;

CREATE TRIGGER trg_auto_create_lead_from_agendamento
  AFTER INSERT OR UPDATE ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_lead_from_agendamento();

CREATE TRIGGER trg_auto_create_patient_from_agendamento
  AFTER INSERT ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_patient_from_agendamento();
