
CREATE OR REPLACE FUNCTION public.auto_create_patient_from_agendamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  extracted_phone text;
  existing_patient_id uuid;
  matched_doctor_id uuid;
BEGIN
  -- Extract phone from notes
  extracted_phone := NULLIF(substring(COALESCE(NEW.notes, '') from '(?:Tel|Telefone|Fone|WhatsApp|Whatsapp)\s*:?\s*([+0-9()\-\s]{8,})'), '');

  -- Check if patient already exists by name in this org
  SELECT id INTO existing_patient_id
  FROM public.clinic_patients
  WHERE organization_id = NEW.organization_id
    AND LOWER(TRIM(name)) = LOWER(TRIM(NEW.patient_name))
  LIMIT 1;

  -- Try to find the doctor by name
  IF NEW.doctor_name IS NOT NULL THEN
    SELECT id INTO matched_doctor_id
    FROM public.clinic_doctors
    WHERE organization_id = NEW.organization_id
      AND LOWER(TRIM(name)) = LOWER(TRIM(NEW.doctor_name))
    LIMIT 1;
  END IF;

  IF existing_patient_id IS NULL THEN
    INSERT INTO public.clinic_patients (
      organization_id, name, phone, doctor_id
    ) VALUES (
      NEW.organization_id,
      TRIM(NEW.patient_name),
      extracted_phone,
      matched_doctor_id
    );
  ELSE
    -- Update phone if we have it and patient doesn't
    UPDATE public.clinic_patients
    SET phone = COALESCE(clinic_patients.phone, extracted_phone),
        doctor_id = COALESCE(clinic_patients.doctor_id, matched_doctor_id)
    WHERE id = existing_patient_id
      AND (clinic_patients.phone IS NULL OR clinic_patients.doctor_id IS NULL);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_patient
AFTER INSERT ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_patient_from_agendamento();
