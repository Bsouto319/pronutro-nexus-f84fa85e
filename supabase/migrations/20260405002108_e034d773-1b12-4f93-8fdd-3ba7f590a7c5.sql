
-- Add doctor profile fields
ALTER TABLE public.clinic_doctors
ADD COLUMN IF NOT EXISTS crm text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS working_days text,
ADD COLUMN IF NOT EXISTS working_hours text,
ADD COLUMN IF NOT EXISTS commission_percent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes text;

-- Add pre-notes field for receptionist on patients
ALTER TABLE public.clinic_patients
ADD COLUMN IF NOT EXISTS pre_notes text;

-- Create follow_ups table for birthday, reactivation, promos
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.clinic_patients(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'manual',
  title text NOT NULL,
  message text,
  scheduled_date date,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view follow_ups" ON public.follow_ups
  FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can insert follow_ups" ON public.follow_ups
  FOR INSERT TO authenticated WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can update follow_ups" ON public.follow_ups
  FOR UPDATE TO authenticated USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can delete follow_ups" ON public.follow_ups
  FOR DELETE TO authenticated USING (is_org_member(auth.uid(), organization_id));
