
-- Create agendamentos table
CREATE TABLE public.agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  patient_name TEXT NOT NULL,
  doctor_name TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  notes TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view agendamentos"
  ON public.agendamentos FOR SELECT
  TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can insert agendamentos"
  ON public.agendamentos FOR INSERT
  TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can update agendamentos"
  ON public.agendamentos FOR UPDATE
  TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can delete agendamentos"
  ON public.agendamentos FOR DELETE
  TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source TEXT DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'novo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can insert leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can delete leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

-- Create gastos table (if not exists)
CREATE TABLE IF NOT EXISTS public.gastos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  descricao TEXT NOT NULL DEFAULT 'Sem descrição',
  valor NUMERIC NOT NULL DEFAULT 0,
  categoria TEXT DEFAULT 'outros',
  fornecedor TEXT,
  metodo_pagamento TEXT,
  data_gasto DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view gastos"
  ON public.gastos FOR SELECT
  TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can insert gastos"
  ON public.gastos FOR INSERT
  TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can update gastos"
  ON public.gastos FOR UPDATE
  TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can delete gastos"
  ON public.gastos FOR DELETE
  TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_agendamentos_org_date ON public.agendamentos(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_leads_org ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_gastos_org ON public.gastos(organization_id);
