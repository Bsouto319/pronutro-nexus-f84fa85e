
-- Fix organization_members INSERT policy to require org membership
DROP POLICY IF EXISTS "Admins can manage members" ON public.organization_members;
CREATE POLICY "Admins can manage members" ON public.organization_members
  FOR INSERT TO public
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) AND
    is_org_member(auth.uid(), organization_id)
  );

-- Fix organization_members DELETE policy to require org membership
DROP POLICY IF EXISTS "Admins can delete members" ON public.organization_members;
CREATE POLICY "Admins can delete members" ON public.organization_members
  FOR DELETE TO public
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND
    is_org_member(auth.uid(), organization_id)
  );
