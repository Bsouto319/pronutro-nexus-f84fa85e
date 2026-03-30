ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS last_message text,
ADD COLUMN IF NOT EXISTS last_message_at timestamptz,
ADD COLUMN IF NOT EXISTS channel text;