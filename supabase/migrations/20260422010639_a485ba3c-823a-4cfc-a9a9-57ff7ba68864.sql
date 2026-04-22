
ALTER TABLE public.clinic_patients
  ADD COLUMN IF NOT EXISTS diagnostics text,
  ADD COLUMN IF NOT EXISTS hpp text,
  ADD COLUMN IF NOT EXISTS current_medications text,
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS important_notes text;
