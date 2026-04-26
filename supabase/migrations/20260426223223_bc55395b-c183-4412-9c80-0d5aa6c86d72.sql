
CREATE TABLE public.patient_prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  doctor_id UUID,
  prescription_type TEXT NOT NULL DEFAULT 'receita_simples',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  instructions TEXT,
  cid TEXT,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_prescriptions_patient ON public.patient_prescriptions(patient_id);
CREATE INDEX idx_prescriptions_org ON public.patient_prescriptions(organization_id);

ALTER TABLE public.patient_prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view prescriptions"
  ON public.patient_prescriptions FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can insert prescriptions"
  ON public.patient_prescriptions FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can update prescriptions"
  ON public.patient_prescriptions FOR UPDATE TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can delete prescriptions"
  ON public.patient_prescriptions FOR DELETE TO authenticated
  USING (is_org_member(auth.uid(), organization_id));
