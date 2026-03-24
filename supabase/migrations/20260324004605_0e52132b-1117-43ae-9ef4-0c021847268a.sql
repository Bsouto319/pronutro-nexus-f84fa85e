
CREATE TABLE public.patient_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.clinic_patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.clinic_doctors(id) ON DELETE SET NULL,
  consultation_date date NOT NULL DEFAULT CURRENT_DATE,
  procedure_name text,
  procedure_value numeric NOT NULL DEFAULT 0,
  payment_method text,
  medications text,
  quantities text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view consultations"
  ON public.patient_consultations FOR SELECT
  TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can insert consultations"
  ON public.patient_consultations FOR INSERT
  TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can update consultations"
  ON public.patient_consultations FOR UPDATE
  TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can delete consultations"
  ON public.patient_consultations FOR DELETE
  TO authenticated
  USING (is_org_member(auth.uid(), organization_id));
