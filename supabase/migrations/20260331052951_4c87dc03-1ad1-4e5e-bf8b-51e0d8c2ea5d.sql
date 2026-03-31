-- Garantir que novos agendamentos gerem/atualizem leads automaticamente
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
    NEW.created_at
  )
  ON CONFLICT DO NOTHING;

  UPDATE public.leads
  SET
    status = normalized_status,
    source = COALESCE(NULLIF(NEW.source, ''), leads.source),
    channel = COALESCE(normalized_channel, leads.channel),
    phone = COALESCE(extracted_phone, leads.phone),
    last_message = COALESCE(NULLIF(NEW.notes, ''), leads.last_message, 'Agendamento atualizado'),
    last_message_at = COALESCE(NEW.created_at, now())
  WHERE leads.organization_id = NEW.organization_id
    AND (
      leads.name = NEW.patient_name
      OR (extracted_phone IS NOT NULL AND leads.phone = extracted_phone)
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_lead_from_agendamento ON public.agendamentos;
CREATE TRIGGER trg_auto_create_lead_from_agendamento
AFTER INSERT OR UPDATE ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_lead_from_agendamento();

ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;