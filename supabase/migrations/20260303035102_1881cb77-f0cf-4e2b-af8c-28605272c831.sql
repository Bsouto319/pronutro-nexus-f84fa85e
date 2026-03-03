
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'doctor', 'staff');

-- Organizations (clinics)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Organization members (links users to orgs with roles)
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- User roles (separate table per security guidelines)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check membership
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

-- Security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper to get user's org ids
CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = _user_id
$$;

-- Doctors
CREATE TABLE public.clinic_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT,
  revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  patients_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinic_doctors ENABLE ROW LEVEL SECURITY;

-- Patients
CREATE TABLE public.clinic_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.clinic_doctors(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinic_patients ENABLE ROW LEVEL SECURITY;

-- Bank accounts
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entradas NUMERIC(12,2) NOT NULL DEFAULT 0,
  saidas NUMERIC(12,2) NOT NULL DEFAULT 0,
  saldo NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Financial transactions
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_date DATE,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  payment_method TEXT,
  description TEXT,
  patient TEXT,
  bank TEXT,
  value_in NUMERIC(12,2) NOT NULL DEFAULT 0,
  value_out NUMERIC(12,2) NOT NULL DEFAULT 0,
  installments INTEGER NOT NULL DEFAULT 1,
  doctor TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_transactions_org_date ON public.financial_transactions(organization_id, date);
CREATE INDEX idx_doctors_org ON public.clinic_doctors(organization_id);
CREATE INDEX idx_patients_org ON public.clinic_patients(organization_id);
CREATE INDEX idx_bank_accounts_org ON public.bank_accounts(organization_id);

-- RLS Policies: organizations
CREATE POLICY "Members can view their orgs" ON public.organizations
  FOR SELECT USING (public.is_org_member(auth.uid(), id));
CREATE POLICY "Admins can insert orgs" ON public.organizations
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update their orgs" ON public.organizations
  FOR UPDATE USING (public.is_org_member(auth.uid(), id) AND public.has_role(auth.uid(), 'admin'));

-- RLS Policies: organization_members
CREATE POLICY "Members can view co-members" ON public.organization_members
  FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Admins can manage members" ON public.organization_members
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete members" ON public.organization_members
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: clinic_doctors
CREATE POLICY "Members can view doctors" ON public.clinic_doctors
  FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Managers can insert doctors" ON public.clinic_doctors
  FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Managers can update doctors" ON public.clinic_doctors
  FOR UPDATE USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Managers can delete doctors" ON public.clinic_doctors
  FOR DELETE USING (public.is_org_member(auth.uid(), organization_id));

-- RLS Policies: clinic_patients
CREATE POLICY "Members can view patients" ON public.clinic_patients
  FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can insert patients" ON public.clinic_patients
  FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can update patients" ON public.clinic_patients
  FOR UPDATE USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can delete patients" ON public.clinic_patients
  FOR DELETE USING (public.is_org_member(auth.uid(), organization_id));

-- RLS Policies: bank_accounts
CREATE POLICY "Members can view bank accounts" ON public.bank_accounts
  FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Managers can manage bank accounts" ON public.bank_accounts
  FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Managers can update bank accounts" ON public.bank_accounts
  FOR UPDATE USING (public.is_org_member(auth.uid(), organization_id));

-- RLS Policies: financial_transactions
CREATE POLICY "Members can view transactions" ON public.financial_transactions
  FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can insert transactions" ON public.financial_transactions
  FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can update transactions" ON public.financial_transactions
  FOR UPDATE USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can delete transactions" ON public.financial_transactions
  FOR DELETE USING (public.is_org_member(auth.uid(), organization_id));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
