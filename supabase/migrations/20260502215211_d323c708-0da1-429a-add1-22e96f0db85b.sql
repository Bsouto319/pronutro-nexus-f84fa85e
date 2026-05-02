-- Seed super_admin role for current super admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'brunosouto1108@gmail.com'
ON CONFLICT DO NOTHING;

-- Update is_super_admin to check user_roles table (with email fallback for safety)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'::public.app_role
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id AND lower(email) = 'brunosouto1108@gmail.com'
  )
$$;

-- Allow super admins to manage super_admin role
CREATE POLICY "Super admins manage super_admin role"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()) AND role = 'super_admin'::public.app_role)
WITH CHECK (public.is_super_admin(auth.uid()) AND role = 'super_admin'::public.app_role);
