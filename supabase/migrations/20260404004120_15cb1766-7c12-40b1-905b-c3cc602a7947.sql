
ALTER TABLE public.clinic_patients 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS referral text,
ADD COLUMN IF NOT EXISTS phone text;
