CREATE OR REPLACE FUNCTION public.auto_create_lead_from_agendamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  extracted_phone text;
  normalized_source text;
  normalized_channel text;
  normalized_status text;
  existing_lead_id uuid;
BEGIN
  extracted_phone := NULLIF(substring(COALESCE(NEW.notes, '') from '(?:Tel|Telefone|Fone|WhatsApp|Whatsapp)\s*:?\s*([+0-9()\-\s]{8,})'), '');
  normalized_source := COALESCE(NULLIF(NEW.source, ''), 'manual');
  normalized_channel := CASE
    WHEN normalized_source ILIKE '%whatsapp%' THEN 'whatsapp'
    WHEN normalized_source ILIKE '%instagram%' THEN 'instagram'
    WHEN normalized_source ILIKE '%phone%' OR normalized_source ILIKE '%telefone%' THEN 'phone'
    ELSE NULL
  END;
  normalized_status := CASE
    WHEN NEW.status = 'confirmado' THEN 'agendado'
    WHEN NEW.status = 'cancelado' THEN 'perdido'
    ELSE 'novo_lead'
  END;

  SELECT l.id
  INTO existing_lead_id
  FROM public.leads l
  WHERE l.organization_id = NEW.organization_id
    AND (
      l.name = NEW.patient_name
      OR (extracted_phone IS NOT NULL AND l.phone = extracted_phone)
    )
  ORDER BY l.created_at DESC
  LIMIT 1;

  IF existing_lead_id IS NULL THEN
    INSERT INTO public.leads (
      organization_id,
      name,
      phone,
      source,
      status,
      channel,
      last_message,
      last_message_at
    )
    VALUES (
      NEW.organization_id,
      NEW.patient_name,
      extracted_phone,
      normalized_source,
      normalized_status,
      normalized_channel,
      COALESCE(NULLIF(NEW.notes, ''), 'Agendamento criado'),
      COALESCE(NEW.created_at, now())
    );
  ELSE
    UPDATE public.leads
    SET
      status = normalized_status,
      source = COALESCE(NULLIF(NEW.source, ''), public.leads.source),
      channel = COALESCE(normalized_channel, public.leads.channel),
      phone = COALESCE(extracted_phone, public.leads.phone),
      last_message = COALESCE(NULLIF(NEW.notes, ''), public.leads.last_message, 'Agendamento atualizado'),
      last_message_at = COALESCE(NEW.created_at, now())
    WHERE id = existing_lead_id;
  END IF;

  RETURN NEW;
END;
$$;

UPDATE public.agendamentos
SET notes = notes
WHERE created_at >= now() - interval '180 days';