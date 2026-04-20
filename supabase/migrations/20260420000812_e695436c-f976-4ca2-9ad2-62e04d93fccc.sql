
-- Coluna de horários por dia (JSONB: {"mon":{"start":"08:00","end":"18:00","off":false}, ...})
ALTER TABLE public.clinic_doctors ADD COLUMN IF NOT EXISTS schedule jsonb DEFAULT '{}'::jsonb;

-- Permitir admin da org gerenciar (UPDATE) papéis dos membros da própria org (com checagem para não auto-promover)
DROP POLICY IF EXISTS "Admins can update member roles" ON public.user_roles;
CREATE POLICY "Admins can update member roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND user_id <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid() AND om2.user_id = user_roles.user_id
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND user_id <> auth.uid()
  AND role IN ('manager','staff','doctor')
);

-- Permitir admin ver papéis dos colegas da org
DROP POLICY IF EXISTS "Admins view org member roles" ON public.user_roles;
CREATE POLICY "Admins view org member roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid() AND om2.user_id = user_roles.user_id
  )
);
