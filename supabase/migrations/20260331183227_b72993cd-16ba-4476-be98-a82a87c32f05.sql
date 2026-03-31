-- Add explicit deny-all UPDATE policy on user_roles to prevent role self-modification
CREATE POLICY "No one can update roles directly"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);