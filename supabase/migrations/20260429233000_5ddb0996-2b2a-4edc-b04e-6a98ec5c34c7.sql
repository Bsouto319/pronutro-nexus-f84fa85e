-- Tabela de notas fiscais do paciente
CREATE TABLE public.patient_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  doctor_id UUID,
  invoice_number TEXT,
  issue_date DATE,
  value NUMERIC DEFAULT 0,
  notes TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_invoices_patient ON public.patient_invoices(patient_id);
CREATE INDEX idx_patient_invoices_org ON public.patient_invoices(organization_id);
CREATE INDEX idx_patient_invoices_number ON public.patient_invoices(invoice_number);

ALTER TABLE public.patient_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view invoices"
  ON public.patient_invoices FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can insert invoices"
  ON public.patient_invoices FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can update invoices"
  ON public.patient_invoices FOR UPDATE TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can delete invoices"
  ON public.patient_invoices FOR DELETE TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE TRIGGER update_patient_invoices_updated_at
  BEFORE UPDATE ON public.patient_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket de armazenamento privado para as notas fiscais
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-invoices', 'patient-invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Policies de storage: caminho dos arquivos = {organization_id}/{patient_id}/{filename}
CREATE POLICY "Org members can view invoice files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'patient-invoices'
    AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Org members can upload invoice files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'patient-invoices'
    AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Org members can update invoice files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'patient-invoices'
    AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Org members can delete invoice files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'patient-invoices'
    AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );