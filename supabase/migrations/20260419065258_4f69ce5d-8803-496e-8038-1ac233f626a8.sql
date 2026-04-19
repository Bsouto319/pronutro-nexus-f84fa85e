-- Super admin role
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Org subscriptions / billing status
CREATE TABLE IF NOT EXISTS public.org_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'trial', -- trial | active | overdue | blocked
  monthly_value numeric NOT NULL DEFAULT 0,
  due_date date,
  last_payment_date date,
  last_payment_value numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper: is super admin (by email)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id AND lower(email) = 'brunosouto1108@gmail.com'
  )
$$;

-- Helper: is org blocked
CREATE OR REPLACE FUNCTION public.is_org_blocked(_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_subscriptions
    WHERE organization_id = _org_id AND status = 'blocked'
  )
$$;

-- RLS: super admin full access; members can view their own
CREATE POLICY "Super admin full access subs" ON public.org_subscriptions
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Members view own subscription" ON public.org_subscriptions
  FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

-- Allow super admin to view all orgs/members/users data
CREATE POLICY "Super admin view all orgs" ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin update orgs" ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin delete orgs" ON public.organizations
  FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin view all members" ON public.organization_members
  FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Trigger updated_at
CREATE TRIGGER trg_org_subs_updated
BEFORE UPDATE ON public.org_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create subscription row when org is created
CREATE OR REPLACE FUNCTION public.auto_create_org_subscription()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.org_subscriptions (organization_id, status)
  VALUES (NEW.id, 'trial')
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_auto_create_org_sub
AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.auto_create_org_subscription();

-- Backfill existing orgs
INSERT INTO public.org_subscriptions (organization_id, status)
SELECT id, 'trial' FROM public.organizations
ON CONFLICT (organization_id) DO NOTHING;

-- Index
CREATE INDEX IF NOT EXISTS idx_org_subs_status ON public.org_subscriptions(status);